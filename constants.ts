import type { Achievement, CellTypeId, ProtectionLevelId } from "./types";

export const CURRENCY = "₴";

export interface CellTypeMeta {
  id: CellTypeId;
  label: string;
  emoji: string;
  hint: string;
}

export const CELL_TYPES: CellTypeMeta[] = [
  { id: "glass_house", label: "Стеклянный домик", emoji: "🏠", hint: "Всё на виду — и это дисциплинирует" },
  { id: "piggy_bank", label: "Копилка", emoji: "🐷", hint: "Классика, которую жалко разбивать" },
  { id: "jar", label: "Банка", emoji: "🫙", hint: "Простая, честная, прозрачная" },
  { id: "money_plant", label: "Денежное растение", emoji: "🌱", hint: "Растёт вместе с вашей целью" },
  { id: "safe", label: "Сейф", emoji: "🔐", hint: "Максимум ощущения защищённости" },
];

export const CELL_TYPE_MAP: Record<CellTypeId, CellTypeMeta> = Object.fromEntries(
  CELL_TYPES.map((t) => [t.id, t]),
) as Record<CellTypeId, CellTypeMeta>;

export interface ProtectionLevelMeta {
  id: ProtectionLevelId;
  label: string;
  dot: string;
  short: string;
  description: string;
}

export const PROTECTION_LEVELS: ProtectionLevelMeta[] = [
  {
    id: "calm",
    label: "Спокойный",
    dot: "🟢",
    short: "Мягкое напоминание",
    description: "Деньги можно открыть в любой момент — VOLT просто напомнит о вашем решении.",
  },
  {
    id: "mindful",
    label: "Осознанный",
    dot: "🟡",
    short: "Пара вопросов перед открытием",
    description: "Перед разблокировкой нужно ответить на несколько вопросов о своём решении.",
  },
  {
    id: "cooldown",
    label: "Охлаждение",
    dot: "🟠",
    short: "Охлаждение — 60 минут ожидания",
    description:
      "После запроса начинается период охлаждения: 60 минут ожидания. Импульс обычно проходит раньше.",
  },
  {
    id: "iron",
    label: "Железный",
    dot: "🔴",
    short: "Заморозка — 24 часа ожидания",
    description:
      "Самый строгий уровень: период заморозки 24 часа и подтверждение решения в несколько шагов.",
  },
];

export const PROTECTION_LEVEL_MAP: Record<ProtectionLevelId, ProtectionLevelMeta> =
  Object.fromEntries(PROTECTION_LEVELS.map((l) => [l.id, l])) as Record<
    ProtectionLevelId,
    ProtectionLevelMeta
  >;

/**
 * Waiting period before an early unlock can be confirmed.
 * Single source of truth: UI copy, the unlock flow and the store all read it from here.
 *
 *  - «Охлаждение» (cooldown level): 60 minutes
 *  - «Заморозка» (iron level): 24 hours
 *
 * `null` = the level has no waiting period.
 */
export interface CoolingPeriod {
  /** "cooling" is shown to the user as «охлаждение», "freeze" as «заморозка». */
  kind: "cooling" | "freeze";
  seconds: number;
  /** Human label, e.g. «60 минут». */
  label: string;
}

export const COOLING_PERIODS: Record<ProtectionLevelId, CoolingPeriod | null> = {
  calm: null,
  mindful: null,
  cooldown: { kind: "cooling", seconds: 60 * 60, label: "60 минут" },
  iron: { kind: "freeze", seconds: 24 * 60 * 60, label: "24 часа" },
};

/** Wording of the waiting period, by kind. */
export const COOLING_WORDING = {
  cooling: {
    title: "Период охлаждения",
    started: "Началось охлаждение",
    resume: "Продолжить охлаждение",
    active: "Идёт охлаждение",
  },
  freeze: {
    title: "Период заморозки",
    started: "Началась заморозка",
    resume: "Продолжить заморозку",
    active: "Идёт заморозка",
  },
} as const;

export const GOAL_PRESETS = [
  { key: "vacation", label: "Отпуск" },
  { key: "purchase", label: "Покупка" },
  { key: "car", label: "Автомобиль" },
  { key: "home", label: "Жильё" },
  { key: "cushion", label: "Финансовая подушка" },
  { key: "custom", label: "Своя цель" },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_vault", title: "Первое хранилище", description: "Создайте первую ячейку", icon: "🎯", target: 1 },
  { id: "first_completed", title: "Первая завершённая ячейка", description: "Доведите ячейку до конца", icon: "🏁", target: 1 },
  { id: "three_completed", title: "3 успешные ячейки", description: "Три ячейки дошли до разблокировки", icon: "🥉", target: 3 },
  { id: "five_completed", title: "5 успешных ячеек", description: "Пять ячеек дошли до разблокировки", icon: "🥈", target: 5 },
  { id: "ten_completed", title: "10 успешных ячеек", description: "Десять ячеек дошли до разблокировки", icon: "🥇", target: 10 },
  { id: "seven_days_clean", title: "7 дней без досрочной разблокировки", description: "Неделя стойкости", icon: "🛡️", target: 7 },
  { id: "first_10k", title: "Сохранено первые 10 000 ₴", description: "Первая десятка под защитой", icon: "💎", target: 10000 },
  { id: "first_pause", title: "Первая пауза", description: "Вы отменили попытку разблокировки", icon: "⏸️", target: 1 },
  { id: "three_pauses", title: "Три паузы", description: "Трижды решили сохранить деньги после паузы", icon: "🧘", target: 3 },
  { id: "first_cooldown", title: "Первое охлаждение", description: "Выдержан период охлаждения", icon: "❄️", target: 1 },
  { id: "three_cooldowns", title: "Три охлаждения", description: "Три выдержанных периода охлаждения", icon: "🌬️", target: 3 },
  { id: "goal_80", title: "80% пути", description: "Средний прогресс по целям достиг 80%", icon: "📈", target: 80 },
];

export const BETA_DISCLAIMER =
  "VOLT не хранит и не блокирует реальные деньги. Суммы в приложении вводятся пользователем вручную.";
