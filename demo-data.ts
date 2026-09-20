import { addDays } from "./format";
import type { SecuritySettings } from "./types";
import type { VoltState } from "./types";

export const SCHEMA_VERSION = 2;

export function defaultSecurity(): SecuritySettings {
  return {
    pinEnabled: false,
    pinHash: null,
    pinSalt: null,
    pinFailures: 0,
    lockedUntil: null,
    credentialId: null,
    biometricEnabled: false,
    autoLockMinutes: 5,
    onboarded: false,
  };
}

/** Real first-run state: no fake cells, attempts or achievements. */
export function createEmptyState(): VoltState {
  return {
    schemaVersion: SCHEMA_VERSION,
    user: {
      id: "user_local",
      name: "Пользователь",
      avatarEmoji: "🦊",
      currency: "₴",
      language: "ru",
      theme: "dark",
      notificationsEnabled: true,
    },
    freeAmount: 0,
    cells: [],
    unlockAttempts: [],
    unlockedAchievements: [],
    security: defaultSecurity(),
  };
}

/** Demo data, only on explicit request (Profile → «Загрузить демо-данные»). */
export function createDemoState(): VoltState {
  return {
    schemaVersion: SCHEMA_VERSION,
    user: {
      id: "user_demo",
      name: "Никита",
      avatarEmoji: "🦊",
      currency: "₴",
      language: "ru",
      theme: "dark",
      notificationsEnabled: true,
    },
    freeAmount: 5000,
    cells: [
      {
        id: "cell_1",
        userId: "user_demo",
        name: "Отпуск",
        type: "glass_house",
        amount: 25000,
        currency: "₴",
        protectionLevel: "iron",
        unlockDate: addDays(27),
        durationDays: 90,
        goal: { preset: "vacation", label: "Отпуск", targetAmount: 50000 },
        goalAmount: 50000,
        createdAt: addDays(-63),
        status: "active",
        visualProgressState: 2,
      },
      {
        id: "cell_2",
        userId: "user_demo",
        name: "Новый телефон",
        type: "piggy_bank",
        amount: 12000,
        currency: "₴",
        protectionLevel: "mindful",
        unlockDate: addDays(43),
        durationDays: 60,
        goal: { preset: "purchase", label: "Покупка", targetAmount: 30000 },
        goalAmount: 30000,
        createdAt: addDays(-17),
        status: "active",
        visualProgressState: 1,
      },
      {
        id: "cell_3",
        userId: "user_demo",
        name: "Финансовая подушка",
        type: "money_plant",
        amount: 30000,
        currency: "₴",
        protectionLevel: "cooldown",
        unlockDate: addDays(104),
        durationDays: 180,
        goal: { preset: "cushion", label: "Финансовая подушка", targetAmount: 100000 },
        goalAmount: 100000,
        createdAt: addDays(-76),
        status: "active",
        visualProgressState: 1,
      },
      {
        id: "cell_4",
        userId: "user_demo",
        name: "Ноутбук",
        type: "safe",
        amount: 18000,
        currency: "₴",
        protectionLevel: "iron",
        unlockDate: addDays(-12),
        durationDays: 120,
        createdAt: addDays(-132),
        status: "completed",
        visualProgressState: 4,
      },
      {
        id: "cell_5",
        userId: "user_demo",
        name: "Ремонт",
        type: "jar",
        amount: 7000,
        currency: "₴",
        protectionLevel: "calm",
        unlockDate: addDays(-40),
        durationDays: 60,
        createdAt: addDays(-100),
        status: "prematurely_unlocked",
        visualProgressState: 1,
      },
    ],
    unlockAttempts: [
      { id: "ua_1", cellId: "cell_5", createdAt: addDays(-41), succeeded: true, reason: "Импульсивная покупка" },
      { id: "ua_2", cellId: "cell_1", createdAt: addDays(-20), succeeded: false, reason: "Скидка/распродажа" },
      { id: "ua_3", cellId: "cell_3", createdAt: addDays(-9), succeeded: false, reason: "Срочные расходы" },
      { id: "ua_4", cellId: "cell_2", createdAt: addDays(-3), succeeded: false, reason: "Импульсивная покупка" },
    ],
    unlockedAchievements: [
      { id: "first_vault", unlockedAt: addDays(-132) },
      { id: "first_completed", unlockedAt: addDays(-12) },
    ],
    security: defaultSecurity(),
  };
}
