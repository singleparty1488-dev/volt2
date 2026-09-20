// Core VOLT domain model (beta foundation).
// NOTE: VOLT never touches real money. All amounts are entered manually.

export type CellTypeId = "glass_house" | "piggy_bank" | "jar" | "money_plant" | "safe";

export type ProtectionLevelId = "calm" | "mindful" | "cooldown" | "iron";

export type CellStatus = "active" | "completed" | "prematurely_unlocked" | "archived";

export type UnlockConditionKind = "date" | "days";
// Future: "goal_reached" | "manual_review" | "accountability_partner"

export interface UnlockCondition {
  kind: UnlockConditionKind;
  /** ISO date string of the resolved unlock moment */
  unlockDate: string;
  durationDays?: number;
}

export interface Goal {
  /** preset key or "custom" */
  preset: string;
  label: string;
  targetAmount?: number;
}

export interface CoolingState {
  startedAt: string;
  /** ISO moment when the cooling period ends. Persisted, so it survives reloads. */
  endsAt: string;
  reason?: string;
}

export interface Cell {
  id: string;
  userId: string;
  name: string;
  type: CellTypeId;
  amount: number;
  currency: string;
  protectionLevel: ProtectionLevelId;
  unlockDate: string;
  durationDays?: number;
  goal?: Goal;
  goalAmount?: number;
  createdAt: string;
  status: CellStatus;
  /** Present only while an early-unlock attempt is cooling down (status stays "active"). */
  cooling?: CoolingState;
  /** 0..4 — reserved for the future visual evolution system */
  visualProgressState: number;
}

export interface UnlockAttempt {
  id: string;
  cellId: string;
  createdAt: string;
  succeeded: boolean;
  reason?: string;
  /** Attempt went through a cooling period. */
  cooled?: boolean;
  /** Milliseconds from cell creation to this attempt. */
  cellAgeMs?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** progress out of `target`, computed from state */
  target: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  /** SHA-256(salt:pin). The PIN itself is never stored. */
  pinHash: string | null;
  pinSalt: string | null;
  pinFailures: number;
  /** ISO moment until which PIN entry is blocked after repeated failures. */
  lockedUntil: string | null;
  /** WebAuthn credential id (base64url) for biometric unlock. */
  credentialId: string | null;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  onboarded: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  currency: string;
  language: "ru";
  theme: "dark" | "light";
  notificationsEnabled: boolean;
}

export interface Statistics {
  totalProtected: number;
  totalPreserved: number;
  totalCells: number;
  completedCells: number;
  prematurelyUnlockedCells: number;
  unlockAttempts: number;
  averageProtectionDays: number;
  longestStreakDays: number;
  unlockReasons: { reason: string; count: number }[];
  goalProgress: { current: number; target: number };
}

export interface VoltState {
  /** localStorage schema version, see migrateState(). */
  schemaVersion: number;
  user: UserProfile;
  cells: Cell[];
  unlockAttempts: UnlockAttempt[];
  unlockedAchievements: UnlockedAchievement[];
  security: SecuritySettings;
  freeAmount: number;
}
