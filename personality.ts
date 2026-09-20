// ============= VOLT Emotional Identity System (Phase 5) =============
//
// Every Cell type is a character with its own voice. Characters react to
// what the user does: creation, progress, unlock attempts, cooling periods,
// completion and premature unlocks.
//
// All state derivation is DETERMINISTIC — pure functions of the existing
// VoltState. Nothing new is persisted, so `volt.state.v1` stays unchanged.
// All UI text lives here (single editable source), in Russian.

import type { Cell, CellTypeId, UnlockAttempt } from "./types";

export type CharacterStateId =
  | "born" // created less than 24h ago — "Ну что, начинаем?"
  | "idle" // resting guard
  | "proud" // goal progress >= 80%
  | "worried" // a failed unlock attempt in the last 48h
  | "cooling" // cooldown-level cell with a recent resisted attempt
  | "celebrating" // status: completed
  | "resting"; // status: prematurely unlocked

export const CHARACTER_STATE_META: Record<
  CharacterStateId,
  { label: string; chip: string }
> = {
  born: { label: "Только родился", chip: "✨" },
  idle: { label: "На страже", chip: "🛡️" },
  proud: { label: "Гордится вами", chip: "🌟" },
  worried: { label: "Волнуется", chip: "💧" },
  cooling: { label: "Остывает вместе с вами", chip: "❄️" },
  celebrating: { label: "Празднует", chip: "🎉" },
  resting: { label: "Отдыхает", chip: "🌙" },
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WORRIED_WINDOW = 2 * DAY;
const COOLING_WINDOW = 3 * DAY;

function lastFailedAttempt(cellId: string, attempts: UnlockAttempt[]) {
  return attempts
    .filter((a) => a.cellId === cellId && !a.succeeded)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/**
 * Resolve the emotional state of a cell's character from existing data only.
 */
export function getCharacterState(
  cell: Cell,
  attempts: UnlockAttempt[],
  now: number = Date.now(),
): CharacterStateId {
  if (cell.status === "completed") return "celebrating";
  if (cell.status === "prematurely_unlocked") return "resting";

  const created = Date.parse(cell.createdAt);
  if (Number.isFinite(created) && now - created < DAY) return "born";

  const recent = lastFailedAttempt(cell.id, attempts);
  if (recent) {
    const age = now - Date.parse(recent.createdAt);
    if (age >= 0 && age < COOLING_WINDOW && cell.protectionLevel === "cooldown") {
      return "cooling";
    }
    if (age >= 0 && age < WORRIED_WINDOW) return "worried";
  }

  if (cell.goalAmount && cell.goalAmount > 0 && cell.amount / cell.goalAmount >= 0.8) {
    return "proud";
  }

  return "idle";
}

// ---------- Character voice ----------

/** Shared lines per state — the baseline voice of VOLT. */
const STATE_LINES: Record<CharacterStateId, string[]> = {
  born: ["Ну что, начинаем? Я здесь, чтобы беречь ваше решение.", "Привет! Я только появился — и уже на страже."],
  idle: ["Всё спокойно. Я слежу за вашими деньгами.", "Тишина в хранилище — как и должно быть."],
  proud: ["Смотрите, как далеко мы зашли! Финиш уже близко.", "80% пути позади. Я вами горжусь."],
  worried: ["Недавно вы чуть не открыли меня… Я рядом, если захотите поговорить о цели.", "Волнуюсь за наше общее решение. Давайте дотерпим?"],
  cooling: ["Пауза — наш союзник. Я подожду вместе с вами.", "Импульс проходит. Я никуда не тороплюсь."],
  celebrating: ["Мы сделали это! Срок выдержан до конца.", "Празднуем! Это ваша победа над импульсами."],
  resting: ["Я не в обиде. Каждая попытка — это опыт.", "Отдыхаю. В следующий раз получится лучше."],
};

/** Per-character overrides — the unique voice of each Cell type. */
const TYPE_LINES: Partial<Record<CellTypeId, Partial<Record<CharacterStateId, string[]>>>> = {
  glass_house: {
    idle: ["У меня всё на виду — и это дисциплинирует нас обоих.", "Прозрачность — моё всё. Заглядывайте чаще."],
    worried: ["Мои стены прозрачные, но решение — твёрдое. Держимся."],
    celebrating: ["Домик выстоял! Светимся от гордости."],
  },
  piggy_bank: {
    idle: ["Хрю-хрю… то есть, всё под контролем.", "Копеечка к копеечке — я помню, зачем мы здесь."],
    worried: ["Меня чуть не разбили… Обниму вашу цель покрепче."],
    born: ["Хрю! Новенькая копилка к вашим услугам."],
  },
  jar: {
    idle: ["Простая банка, честная работа.", "Стою себе, храню. Без суеты."],
    worried: ["Крышка держится. Давайте не будем её крутить."],
  },
  money_plant: {
    idle: ["Расту вместе с вашей целью. Поливать не нужно — просто не трогайте.", "Каждый день терпения — новый листик."],
    proud: ["Смотрите, как я вырос! Ещё чуть-чуть — и плоды созреют."],
    cooling: ["Тишина и прохлада — лучшая почва для роста."],
  },
  safe: {
    idle: ["Замок смазан, дверца тяжёлая. Всё как я люблю.", "Я не открываюсь от лёгкого ветерка."],
    worried: ["Попытка взлома отбита. Я серьёзно. Улыбаюсь, но серьёзно."],
    cooling: ["Таймер тикает. Я умею ждать — и вы умеете."],
  },
};

/**
 * Deterministically pick a phrase for a character. Same cell + same day =
 * same phrase, so the character feels stable rather than random.
 */
export function getCharacterLine(
  type: CellTypeId,
  state: CharacterStateId,
  seed: number,
): string {
  const pool = TYPE_LINES[type]?.[state] ?? STATE_LINES[state];
  return pool[Math.abs(seed) % pool.length] ?? STATE_LINES[state][0] ?? "";
}

/** Stable daily seed so phrases change day-to-day, not render-to-render. */
export function dailySeed(cellId: string, now: number = Date.now()): number {
  const day = Math.floor(now / DAY);
  let h = day;
  for (let i = 0; i < cellId.length; i++) h = (h * 31 + cellId.charCodeAt(i)) | 0;
  return h;
}

/** The longest-living active cell — the vault's "senior" character. */
export function getVaultSenior(cells: Cell[]): Cell | null {
  const active = cells.filter((c) => c.status === "active");
  if (active.length === 0) return null;
  return active.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
}

/** Short greeting from the vault's "senior" character for the home screen. */
export function getVaultGreeting(cells: Cell[], attempts: UnlockAttempt[]): string | null {
  const senior = getVaultSenior(cells);
  if (!senior) return null;
  const state = getCharacterState(senior, attempts);
  return getCharacterLine(senior.type, state, dailySeed(senior.id));
}
