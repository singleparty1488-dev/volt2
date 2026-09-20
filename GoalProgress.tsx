import { formatAmount } from "@/lib/volt/format";
import { cn } from "@/lib/utils";

export function GoalProgress({
  current,
  target,
  currency,
  showValues = true,
  className,
}: {
  current: number;
  target: number;
  currency?: string;
  showValues?: boolean;
  className?: string;
}) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {showValues && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">
            {formatAmount(current, currency)} / {formatAmount(target, currency)}
          </span>
          <span className="shrink-0 font-semibold text-gold">{percent}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-mint to-gold transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
