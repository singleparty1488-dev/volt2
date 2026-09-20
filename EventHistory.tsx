import { COOLING_PERIODS, COOLING_WORDING } from "@/lib/volt/constants";
import type { Cell, UnlockAttempt } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

const fmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface Ev {
  at: string;
  title: string;
  note?: string;
  tone: "neutral" | "good" | "warn";
}

/** Timeline built only from real data: creation, unlock attempts, and how the cell ended. */
export function EventHistory({ cell, attempts }: { cell: Cell; attempts: UnlockAttempt[] }) {
  const period = COOLING_PERIODS[cell.protectionLevel];
  // A waiting period that is running right now (finished ones are recorded on the attempt).
  const running: Ev[] =
    cell.cooling && cell.status === "active"
      ? [
          {
            at: cell.cooling.startedAt,
            title: `${COOLING_WORDING[period?.kind ?? "cooling"].started}${period ? ` — ${period.label}` : ""}`,
            tone: "neutral",
          },
        ]
      : [];

  const events: Ev[] = [
    { at: cell.createdAt, title: "Ячейка создана", tone: "neutral" },
    ...running,
    ...attempts
      .filter((a) => a.cellId === cell.id)
      .map<Ev>((a) => {
        const base = a.succeeded
          ? { title: "Открыта досрочно", tone: "warn" as const }
          : {
              title: a.cooled ? "Пауза выдержана — деньги остались" : "Решил(а) сохранить деньги",
              tone: "good" as const,
            };
        return { at: a.createdAt, ...base, ...(a.reason ? { note: a.reason } : {}) };
      }),
    ...(cell.status === "completed"
      ? [{ at: cell.unlockDate, title: "Срок защиты завершён", tone: "good" as const }]
      : []),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <section className="rounded-3xl border border-border/70 bg-card/60 p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">История</p>
      <ol className="mt-3 space-y-3">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 h-2 w-2 rounded-full",
                e.tone === "good" && "bg-mint",
                e.tone === "warn" && "bg-destructive",
                e.tone === "neutral" && "bg-muted-foreground",
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {fmt.format(new Date(e.at))}
                {e.note ? ` · ${e.note}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
