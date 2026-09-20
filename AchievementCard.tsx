import { Award, Flag, Gem, Medal, Pause, ShieldCheck, Snowflake, Target, TrendingUp, Trophy, Wind, type LucideIcon } from "lucide-react";

import { GoalProgress } from "./GoalProgress";
import type { Achievement } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  first_vault: Target,
  first_completed: Flag,
  three_completed: Medal,
  five_completed: Award,
  ten_completed: Trophy,
  seven_days_clean: ShieldCheck,
  first_10k: Gem,
  first_pause: Pause,
  three_pauses: Pause,
  first_cooldown: Snowflake,
  three_cooldowns: Wind,
  goal_80: TrendingUp,
};

export function AchievementCard({
  achievement,
  progress,
}: {
  achievement: Achievement;
  progress: number;
}) {
  const unlocked = progress >= achievement.target;
  const Icon = ICONS[achievement.id] ?? Trophy;

  return (
    <div
      className={cn(
        "rounded-3xl border p-4 transition-colors",
        unlocked
          ? "border-gold/40 bg-card shadow-[var(--shadow-vault)]"
          : "border-border/60 bg-card/50",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            unlocked ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground opacity-60",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{achievement.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{achievement.description}</p>
        </div>
      </div>
      {!unlocked && achievement.target > 1 && (
        <GoalProgress
          className="mt-3"
          current={Math.min(progress, achievement.target)}
          target={achievement.target}
          showValues={false}
        />
      )}
      {unlocked && <p className="mt-3 text-xs font-medium text-gold">Получено</p>}
    </div>
  );
}
