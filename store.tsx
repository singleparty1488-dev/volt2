import * as React from "react";

import { registerBiometric, verifyBiometric } from "./biometrics";
import { ACHIEVEMENTS, COOLING_PERIODS } from "./constants";
import { SCHEMA_VERSION, createDemoState, createEmptyState, defaultSecurity } from "./demo-data";
import { newId } from "./ids";
import { hashPin, lockoutMs, newSalt } from "./pin";
import { achievementProgress } from "./stats";
import type { Cell, CellStatus, SecuritySettings, UserProfile, VoltState } from "./types";

const STORAGE_KEY = "volt.state.v2";
const LEGACY_KEY = "volt.state.v1";

/** Cell lifecycle as a real state machine: only these transitions are legal. */
const TRANSITIONS: Record<CellStatus, CellStatus[]> = {
  active: ["completed", "prematurely_unlocked", "archived"],
  completed: ["archived"],
  prematurely_unlocked: ["archived"],
  archived: [],
};

/** Applies a legal transition; money returns to «Свободно» when a cell is released. */
function applyTransition(s: VoltState, cellId: string, to: CellStatus): VoltState {
  const cell = s.cells.find((c) => c.id === cellId);
  if (!cell || !TRANSITIONS[cell.status].includes(to)) return s;
  const released = to === "completed" || to === "prematurely_unlocked";
  const { cooling: _cooling, ...rest } = cell;
  return {
    ...s,
    cells: s.cells.map((c) => (c.id === cellId ? { ...rest, status: to } : c)),
    freeAmount: s.freeAmount + (released ? cell.amount : 0),
  };
}

function completeDueCells(s: VoltState, now = Date.now()): VoltState {
  return s.cells
    .filter((c) => c.status === "active" && new Date(c.unlockDate).getTime() <= now)
    .reduce((acc, c) => applyTransition(acc, c.id, "completed"), s);
}

function syncAchievements(s: VoltState): VoltState {
  const have = new Set(s.unlockedAchievements.map((a) => a.id));
  const earned = ACHIEVEMENTS.filter(
    (a) => !have.has(a.id) && achievementProgress(s, a.id) >= a.target,
  );
  if (!earned.length) return s;
  const at = new Date().toISOString();
  return {
    ...s,
    unlockedAchievements: [
      ...s.unlockedAchievements,
      ...earned.map((a) => ({ id: a.id, unlockedAt: at })),
    ],
  };
}

/** Upgrades any older persisted shape to the current schema. Never throws away user cells. */
function migrateState(raw: unknown): { state: VoltState; legacyPin: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, any>;
  if (!Array.isArray(s.cells)) return null;
  const base = createEmptyState();
  const sec = { ...defaultSecurity(), ...(s.security ?? {}) } as SecuritySettings & { pin?: string | null };
  const legacyPin = typeof sec.pin === "string" && sec.pin ? sec.pin : null;
  delete sec.pin;
  const state: VoltState = {
    schemaVersion: SCHEMA_VERSION,
    user: { ...base.user, ...(s.user ?? {}) },
    freeAmount: typeof s.freeAmount === "number" ? s.freeAmount : 0,
    cells: s.cells.map((c: Cell) => ({ ...c, id: c.id ?? newId("cell") })),
    unlockAttempts: (Array.isArray(s.unlockAttempts) ? s.unlockAttempts : []).map((a: any) => ({
      ...a,
      id: a.id ?? newId("att"),
    })),
    unlockedAchievements: Array.isArray(s.unlockedAchievements) ? s.unlockedAchievements : [],
    security: sec,
  };
  return { state, legacyPin };
}

type Ctx = {
  state: VoltState;
  hydrated: boolean;
  locked: boolean;
  addCell: (cell: Omit<Cell, "id" | "userId" | "createdAt" | "status" | "visualProgressState">) => Cell;
  updateSecurity: (patch: Partial<SecuritySettings>) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  lock: () => void;
  unlock: () => void;
  /** PIN lifecycle: set → verify (with lockout) → clear. */
  setPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  verifyPin: (pin: string) => Promise<{ ok: boolean; retryInMs?: number }>;
  /** Biometrics: real WebAuthn registration / assertion. */
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => void;
  unlockWithBiometric: () => Promise<boolean>;
  /** Starts a persisted cooling period for an early-unlock attempt. */
  startCooling: (cellId: string, reason: string | undefined, seconds: number) => void;
  /**
   * Finishes an unlock attempt atomically: logs it, clears cooling and, if it
   * succeeded, moves the cell active → prematurely_unlocked. Returns false if refused
   * (cell not active, or cooling still running).
   */
  resolveAttempt: (cellId: string, succeeded: boolean, reason?: string) => boolean;
  resetDemo: () => void;
  resetAll: () => void;
};

const VoltContext = React.createContext<Ctx | null>(null);

export function VoltProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<VoltState>(() => createEmptyState());
  const [hydrated, setHydrated] = React.useState(false);
  const [locked, setLocked] = React.useState(false);

  // Read persisted state after hydration to avoid SSR mismatches.
  React.useEffect(() => {
    (async () => {
      try {
        const raw =
          window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
        const migrated = raw ? migrateState(JSON.parse(raw)) : null;
        if (migrated) {
          let { state: next } = migrated;
          if (migrated.legacyPin && !next.security.pinHash) {
            const salt = newSalt();
            next = {
              ...next,
              security: {
                ...next.security,
                pinSalt: salt,
                pinHash: await hashPin(migrated.legacyPin, salt),
                pinEnabled: true,
              },
            };
          }
          next = syncAchievements(completeDueCells(next));
          setState(next);
          if (next.security.pinEnabled && next.security.pinHash) setLocked(true);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.localStorage.removeItem(LEGACY_KEY);
        }
      } catch {
        /* ignore corrupted storage */
      }
      setHydrated(true);
    })();
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  // Lifecycle tick: complete cells whose date has passed; award achievements from real data.
  React.useEffect(() => {
    if (!hydrated) return;
    const tick = () => setState((s) => completeDueCells(s));
    const iv = window.setInterval(tick, 30_000);
    const vis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", vis);
    tick();
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    setState((s) => syncAchievements(s));
  }, [hydrated, state.cells, state.unlockAttempts]);

  // Automatic locking after inactivity (also checked when the tab returns to the foreground).
  const pinActive = state.security.pinEnabled && !!state.security.pinHash;
  React.useEffect(() => {
    if (!hydrated || locked || !pinActive) return;
    const ms = state.security.autoLockMinutes * 60_000;
    let last = Date.now();
    const check = () => Date.now() - last >= ms && setLocked(true);
    const touch = () => {
      last = Date.now();
    };
    const vis = () => document.visibilityState === "visible" && check();
    const iv = window.setInterval(check, 5_000);
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [hydrated, locked, pinActive, state.security.autoLockMinutes]);

  const value = React.useMemo<Ctx>(() => {
    const patchSecurity = (patch: Partial<SecuritySettings>) =>
      setState((s) => ({ ...s, security: { ...s.security, ...patch } }));

    return {
      state,
      hydrated,
      locked,
      addCell: (input) => {
        const cell: Cell = {
          ...input,
          id: newId("cell"),
          userId: state.user.id,
          createdAt: new Date().toISOString(),
          status: "active",
          visualProgressState: 0,
        };
        setState((s) => ({ ...s, cells: [cell, ...s.cells] }));
        return cell;
      },
      updateSecurity: patchSecurity,
      updateUser: (patch) => setState((s) => ({ ...s, user: { ...s.user, ...patch } })),
      lock: () => setLocked(true),
      unlock: () => setLocked(false),

      setPin: async (pin) => {
        const salt = newSalt();
        patchSecurity({
          pinEnabled: true,
          pinSalt: salt,
          pinHash: await hashPin(pin, salt),
          pinFailures: 0,
          lockedUntil: null,
          onboarded: true,
        });
      },
      clearPin: () =>
        patchSecurity({
          pinEnabled: false,
          pinHash: null,
          pinSalt: null,
          pinFailures: 0,
          lockedUntil: null,
          biometricEnabled: false,
          credentialId: null,
        }),
      verifyPin: async (pin) => {
        const sec = state.security;
        const wait = sec.lockedUntil ? new Date(sec.lockedUntil).getTime() - Date.now() : 0;
        if (wait > 0) return { ok: false, retryInMs: wait };
        const ok = !!sec.pinHash && !!sec.pinSalt && (await hashPin(pin, sec.pinSalt)) === sec.pinHash;
        if (ok) {
          patchSecurity({ pinFailures: 0, lockedUntil: null });
          return { ok: true };
        }
        const failures = sec.pinFailures + 1;
        const ms = lockoutMs(failures);
        patchSecurity({
          pinFailures: failures,
          lockedUntil: ms ? new Date(Date.now() + ms).toISOString() : null,
        });
        return { ok: false, ...(ms ? { retryInMs: ms } : {}) };
      },

      enableBiometric: async () => {
        const id = await registerBiometric(state.user.id, state.user.name);
        patchSecurity(id ? { biometricEnabled: true, credentialId: id } : { biometricEnabled: false });
        return !!id;
      },
      disableBiometric: () => patchSecurity({ biometricEnabled: false, credentialId: null }),
      unlockWithBiometric: async () => {
        const ok = await verifyBiometric(state.security.credentialId);
        if (ok) setLocked(false);
        return ok;
      },

      startCooling: (cellId, reason, seconds) => {
        if (!(seconds > 0)) return;
        const now = Date.now();
        setState((s) => ({
          ...s,
          cells: s.cells.map((c) =>
            c.id === cellId && c.status === "active" && !c.cooling
              ? {
                  ...c,
                  cooling: {
                    startedAt: new Date(now).toISOString(),
                    endsAt: new Date(now + seconds * 1000).toISOString(),
                    ...(reason ? { reason } : {}),
                  },
                }
              : c,
          ),
        }));
      },
      resolveAttempt: (cellId, succeeded, reason) => {
        const cell = state.cells.find((c) => c.id === cellId);
        if (!cell || cell.status !== "active") return false;
        if (succeeded) {
          // The waiting period is enforced here, not just in the UI:
          // cooldown / iron cells cannot be unlocked early without a finished period.
          if (COOLING_PERIODS[cell.protectionLevel] && !cell.cooling) return false;
          if (cell.cooling && new Date(cell.cooling.endsAt).getTime() > Date.now()) return false;
        }
        const now = Date.now();
        const attempt = {
          id: newId("att"),
          cellId,
          createdAt: new Date(now).toISOString(),
          succeeded,
          cooled: !!cell.cooling,
          cellAgeMs: Math.max(0, now - new Date(cell.createdAt).getTime()),
          ...(reason ? { reason } : {}),
        };
        setState((s) => {
          const withAttempt = { ...s, unlockAttempts: [attempt, ...s.unlockAttempts] };
          if (succeeded) return applyTransition(withAttempt, cellId, "prematurely_unlocked");
          return {
            ...withAttempt,
            cells: withAttempt.cells.map((c) => {
              if (c.id !== cellId) return c;
              const { cooling: _cooling, ...rest } = c;
              return rest;
            }),
          };
        });
        return true;
      },

      resetDemo: () => {
        setState(createDemoState());
        setLocked(false);
      },
      resetAll: () => {
        setState(createEmptyState());
        setLocked(false);
      },
    };
  }, [state, hydrated, locked]);

  return <VoltContext.Provider value={value}>{children}</VoltContext.Provider>;
}

export function useVolt() {
  const ctx = React.useContext(VoltContext);
  if (!ctx) throw new Error("useVolt must be used inside VoltProvider");
  return ctx;
}
