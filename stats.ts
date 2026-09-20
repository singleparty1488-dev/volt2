import type { Statistics, VoltState } from "./types";

export function computeStatistics(state: VoltState): Statistics {
  const { cells, unlockAttempts } = state;
  const active = cells.filter((c) => c.status === "active");
  const completed = cells.filter((c) => c.status === "completed");
  const premature = cells.filter((c) => c.status === "prematurely_unlocked");

  const durations = cells.map((c) => c.durationDays ?? 0).filter(Boolean);
  const reasons = new Map<string, number>();
  for (const a of unlockAttempts) {
    if (!a.reason) continue;
    reasons.set(a.reason, (reasons.get(a.reason) ?? 0) + 1);
  }

  const goalCells = cells.filter((c) => c.goalAmount);

  return {
    totalProtected: active.reduce((s, c) => s + c.amount, 0),
    totalPreserved: completed.reduce((s, c) => s + c.amount, 0),
    totalCells: cells.length,
    completedCells: completed.length,
    prematurelyUnlockedCells: premature.length,
    unlockAttempts: unlockAttempts.length,
    averageProtectionDays: durations.length
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : 0,
    longestStreakDays: streakStats(state).longest,
    unlockReasons: [...reasons.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    goalProgress: {
      current: goalCells.reduce((s, c) => s + c.amount, 0),
      target: goalCells.reduce((s, c) => s + (c.goalAmount ?? 0), 0),
    },
  };
}

const DAY_MS = 86_400_000;

/**
 * Days without an early unlock, computed from real events: the streak starts at the
 * first cell ever created and resets on every successful (premature) unlock.
 */
export function streakStats(state: VoltState, now: number = Date.now()) {
  const created = state.cells.map((c) => new Date(c.createdAt).getTime()).filter(Number.isFinite);
  if (!created.length) return { current: 0, longest: 0 };
  const start = Math.min(...created);
  const breaks = state.unlockAttempts
    .filter((a) => a.succeeded)
    .map((a) => new Date(a.createdAt).getTime())
    .filter((t) => Number.isFinite(t) && t >= start)
    .sort((a, b) => a - b);
  const points = [start, ...breaks, now];
  let longest = 0;
  for (let i = 1; i < points.length; i++) longest = Math.max(longest, points[i] - points[i - 1]);
  return {
    current: Math.floor((now - points[points.length - 2]) / DAY_MS),
    longest: Math.floor(longest / DAY_MS),
  };
}

export function achievementProgress(state: VoltState, id: string): number {
  const completed = state.cells.filter((c) => c.status === "completed").length;
  const protectedSum = state.cells
    .filter((c) => c.status === "active" || c.status === "completed")
    .reduce((s, c) => s + c.amount, 0);

  switch (id) {
    case "first_vault":
      return state.cells.length ? 1 : 0;
    case "first_completed":
      return Math.min(completed, 1);
    case "three_completed":
    case "five_completed":
    case "ten_completed":
      return completed;
    case "seven_days_clean":
      return streakStats(state).current;
    case "first_10k":
      return protectedSum;
    case "first_pause":
    case "three_pauses":
      // Cancelled unlocks = attempts that did not end in unlocking.
      return state.unlockAttempts.filter((a) => !a.succeeded).length;
    case "first_cooldown":
    case "three_cooldowns":
      // Cancelled attempts that really went through a cooling period
      // (legacy attempts without the flag fall back to the protection level).
      return state.unlockAttempts.filter((a) => {
        if (a.succeeded) return false;
        if (a.cooled !== undefined) return a.cooled;
        const cell = state.cells.find((c) => c.id === a.cellId);
        return cell?.protectionLevel === "cooldown" || cell?.protectionLevel === "iron";
      }).length;
    case "goal_80": {
      const goalCells = state.cells.filter((c) => c.goalAmount);
      if (!goalCells.length) return 0;
      const avg =
        goalCells.reduce((s, c) => s + Math.min(1, c.amount / Math.max(1, c.goalAmount ?? 1)), 0) /
        goalCells.length;
      return Math.round(avg * 100);
    }
    default:
      return 0;
  }
}
