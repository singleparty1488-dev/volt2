// Financial behavior patterns (Phase 4).
// Deterministic, local-only heuristics derived from data VOLT already stores.
// These are behavioral indicators, NOT psychological or medical assessments.

import { PROTECTION_LEVELS } from "./constants";
import type { Cell, ProtectionLevelId, UnlockAttempt, VoltState } from "./types";

export interface PatternScore {
  id: "impulse" | "planned" | "pause" | "commitment";
  title: string;
  score: number; // 0..100
  description: string;
  enoughData: boolean;
}

export interface ReasonShare {
  reason: string;
  count: number;
  percent: number;
}

export interface ProtectionShare {
  id: ProtectionLevelId;
  label: string;
  dot: string;
  count: number;
  percent: number;
}

export interface Insight {
  id: string;
  text: string;
  tone: "neutral" | "positive";
}

export interface BehaviorPatterns {
  enoughData: boolean;
  dataPoints: number;
  overview: string;
  scores: PatternScore[];
  protection: ProtectionShare[];
  reasons: ReasonShare[];
  insights: Insight[];
  successes: Insight[];
  kept: number; // unlock attempts that did not end in unlocking
  attempts: number;
}

const MIN_DATA_POINTS = 3;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function daysBetween(a: string, b: string) {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

const IMPULSE_REASONS = ["Импульсивная покупка", "Импульсивное желание", "Скидка/распродажа"];

/** Attempts that did not lead to an unlock — the user paused and kept the money. */
function keptAttempts(attempts: UnlockAttempt[]) {
  return attempts.filter((a) => !a.succeeded);
}

function attemptSpeed(attempt: UnlockAttempt, cells: Cell[]) {
  const cell = cells.find((c) => c.id === attempt.cellId);
  if (!cell) return null;
  return daysBetween(cell.createdAt, attempt.createdAt);
}

export function calculateBehaviorPatterns(state: VoltState): BehaviorPatterns {
  const { cells, unlockAttempts } = state;
  const attempts = unlockAttempts.length;
  const kept = keptAttempts(unlockAttempts).length;
  const completed = cells.filter((c) => c.status === "completed");
  const premature = cells.filter((c) => c.status === "prematurely_unlocked");
  const finished = completed.length + premature.length;
  const dataPoints = cells.length + attempts;
  const enoughData = dataPoints >= MIN_DATA_POINTS;

  // --- Impulse tendency -------------------------------------------------
  const impulseReasonCount = unlockAttempts.filter(
    (a) => a.reason && IMPULSE_REASONS.includes(a.reason),
  ).length;
  const quickAttempts = unlockAttempts.filter((a) => {
    const d = attemptSpeed(a, cells);
    return d !== null && d <= 7;
  }).length;
  const impulseScore = clamp(
    (attempts ? (impulseReasonCount / attempts) * 45 : 0) +
      (attempts ? (quickAttempts / attempts) * 30 : 0) +
      (finished ? (premature.length / finished) * 25 : 0),
  );

  // --- Planned tendency -------------------------------------------------
  const withGoal = cells.filter((c) => Boolean(c.goal || c.goalAmount)).length;
  const longCells = cells.filter((c) => (c.durationDays ?? 0) >= 90).length;
  const plannedScore = clamp(
    (cells.length ? (withGoal / cells.length) * 55 : 0) +
      (cells.length ? (longCells / cells.length) * 25 : 0) +
      (100 - impulseScore) * 0.2,
  );

  // --- Ability to pause -------------------------------------------------
  const pauseScore = clamp(
    (attempts ? (kept / attempts) * 70 : 55) +
      (cells.filter((c) => c.protectionLevel === "cooldown" || c.protectionLevel === "iron")
        .length /
        Math.max(1, cells.length)) *
        30,
  );

  // --- Goal commitment --------------------------------------------------
  const goalCells = cells.filter((c) => c.goalAmount);
  const goalProgress = goalCells.length
    ? goalCells.reduce(
        (s, c) => s + Math.min(1, c.amount / Math.max(1, c.goalAmount ?? 1)),
        0,
      ) / goalCells.length
    : 0;
  const commitmentScore = clamp(
    (finished ? (completed.length / finished) * 55 : 40) + goalProgress * 45,
  );

  const scores: PatternScore[] = [
    {
      id: "impulse",
      title: "Импульсивные решения",
      score: impulseScore,
      description:
        impulseScore >= 60
          ? "За последнее время часть твоих решений была принята достаточно быстро."
          : "Чаще всего ты не спешишь с решениями о деньгах.",
      enoughData: attempts > 0 || finished > 0,
    },
    {
      id: "planned",
      title: "Плановые решения",
      score: plannedScore,
      description:
        plannedScore >= 60
          ? "Ты обычно создаёшь ячейки под конкретную цель и заранее."
          : "Пока часть ячеек создаётся без чёткой цели или срока.",
      enoughData: cells.length > 0,
    },
    {
      id: "pause",
      title: "Умение остановиться",
      score: pauseScore,
      description:
        pauseScore >= 60
          ? "Ты часто даёшь себе время перед окончательным решением."
          : "Паузу пока удаётся выдержать не всегда — и это нормально.",
      enoughData: attempts > 0,
    },
    {
      id: "commitment",
      title: "Верность цели",
      score: commitmentScore,
      description:
        commitmentScore >= 60
          ? "Большинство твоих целей доходят до конца."
          : "Цели пока в процессе — данных для выводов немного.",
      enoughData: cells.length > 0,
    },
  ];

  // --- Protection preference -------------------------------------------
  const protection: ProtectionShare[] = PROTECTION_LEVELS.map((l) => {
    const count = cells.filter((c) => c.protectionLevel === l.id).length;
    return { id: l.id, label: l.label, dot: l.dot, count, percent: percent(count, cells.length) };
  });

  // --- Reasons ----------------------------------------------------------
  const reasonMap = new Map<string, number>();
  for (const a of unlockAttempts) {
    if (!a.reason) continue;
    reasonMap.set(a.reason, (reasonMap.get(a.reason) ?? 0) + 1);
  }
  const reasonTotal = [...reasonMap.values()].reduce((s, n) => s + n, 0);
  const reasons: ReasonShare[] = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count, percent: percent(count, reasonTotal) }))
    .sort((a, b) => b.count - a.count);

  // --- Insights (data-driven only) --------------------------------------
  const insights: Insight[] = [];
  const topProtection = [...protection].sort((a, b) => b.count - a.count)[0];
  if (topProtection && topProtection.count > 0 && cells.length >= 2) {
    insights.push({
      id: "protection",
      tone: "neutral",
      text: `Ты чаще выбираешь уровень «${topProtection.label}».`,
    });
  }
  if (attempts >= 2) {
    const early = percent(quickAttempts, attempts);
    if (early >= 50) {
      insights.push({
        id: "early",
        tone: "neutral",
        text: `Большинство твоих попыток разблокировки происходят в первые 7 дней (${early}%).`,
      });
    }
  }
  const bigGoalCells = cells.filter((c) => (c.goalAmount ?? 0) >= 50000).length;
  if (cells.length >= 2 && bigGoalCells / cells.length >= 0.3) {
    insights.push({
      id: "big-goals",
      tone: "neutral",
      text: "Ты чаще всего создаёшь ячейки на крупные цели.",
    });
  }
  if (reasons[0] && reasonTotal >= 2) {
    insights.push({
      id: "top-reason",
      tone: "neutral",
      text: `Чаще всего причина обращения к ячейке — «${reasons[0].reason}».`,
    });
  }

  const successes: Insight[] = [];
  if (kept > 0) {
    successes.push({
      id: "kept",
      tone: "positive",
      text: `В ${kept} из ${attempts} случаев ты решил сохранить деньги после паузы.`,
    });
  }
  if (kept >= 2) {
    successes.push({ id: "pause-works", tone: "positive", text: "Пауза сработала." });
  }
  if (completed.length > 0) {
    successes.push({
      id: "completed",
      tone: "positive",
      text: `Ячеек, доведённых до конца: ${completed.length}.`,
    });
  }
  if (goalProgress >= 0.8 && goalCells.length > 0) {
    successes.push({
      id: "goal-progress",
      tone: "positive",
      text: "Твои цели в среднем пройдены более чем на 80%.",
    });
  }

  const overview = !enoughData
    ? "Пока недостаточно данных. Создай несколько ячеек — и здесь появится твой профиль решений."
    : pauseScore >= impulseScore
      ? "Ты чаще принимаешь решения с паузой, чем на импульсе."
      : "Часть решений ты принимаешь быстро — пауза помогает тебе реже, но она работает.";

  return {
    enoughData,
    dataPoints,
    overview,
    scores,
    protection,
    reasons,
    insights,
    successes,
    kept,
    attempts,
  };
}
