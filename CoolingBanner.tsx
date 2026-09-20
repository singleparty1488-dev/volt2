import * as React from "react";
import { Snowflake } from "lucide-react";

import { COOLING_PERIODS, COOLING_WORDING } from "@/lib/volt/constants";
import { formatCountdown, formatDateTime } from "@/lib/volt/format";
import type { Cell } from "@/lib/volt/types";

/**
 * Live status of a running waiting period on the cell screen:
 * «охлаждение» (60 min) or «заморозка» (24 h). Reads the persisted `cell.cooling`,
 * so it survives reloads and re-entry.
 */
export function CoolingBanner({ cell }: { cell: Cell }) {
  const cooling = cell.cooling;
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!cooling) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [cooling]);

  if (!cooling || cell.status !== "active") return null;

  const wording = COOLING_WORDING[COOLING_PERIODS[cell.protectionLevel]?.kind ?? "cooling"];
  const seconds = Math.max(0, Math.ceil((new Date(cooling.endsAt).getTime() - now) / 1000));

  return (
    <section className="flex items-center gap-3 rounded-3xl border border-level-cooldown/30 bg-level-cooldown/10 p-4">
      <Snowflake className="h-5 w-5 shrink-0 text-level-cooldown" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{wording.active}</p>
        <p className="text-xs text-muted-foreground">
          {seconds > 0
            ? `Осталось ${formatCountdown(seconds)} · до ${formatDateTime(cooling.endsAt)}`
            : "Период завершён — можно принять решение"}
        </p>
      </div>
    </section>
  );
}
