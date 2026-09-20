import { cn } from "@/lib/utils";

export function PatternMeter({
  title,
  score,
  description,
  enoughData = true,
  className,
}: {
  title: string;
  score: number;
  description: string;
  enoughData?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-card/60 p-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate text-sm font-semibold">{title}</h3>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {enoughData ? `${score} / 100` : "—"}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--mint),var(--gold))] transition-[width] duration-700"
          style={{ width: `${enoughData ? Math.max(4, score) : 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {enoughData ? description : "Пока недостаточно данных."}
      </p>
    </div>
  );
}

export function ShareRow({
  label,
  percent,
  dot,
}: {
  label: string;
  percent: number;
  dot?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">
          {dot ? <span className="mr-1.5">{dot}</span> : null}
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground/40 transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
