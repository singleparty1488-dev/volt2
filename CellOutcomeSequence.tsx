import * as React from "react";

import { MoneyCharacter, MoneyCrowd } from "./MoneyCharacter";
import { CELL_TYPE_MAP } from "@/lib/volt/constants";
import { getVaultMessage } from "@/lib/volt/vaultMessages";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CellTypeId } from "@/lib/volt/types";
import { CellTypeIcon } from "./icons";
import { cn } from "@/lib/utils";

/** Per-type visual metaphor of "breaking" — the CELL image, never real money. */
const BREAK_COPY: Record<CellTypeId, string> = {
  glass_house: "Свет гаснет, по стеклу идёт трещина…",
  piggy_bank: "Копилка треснула, монетки раскатились…",
  jar: "Банка треснула по краю…",
  money_plant: "Растение клонится, листья опадают…",
  safe: "Сейф открывается, внутренний свет гаснет…",
};

const COMPLETE_COPY = "Свет включается. Срок выдержан до конца.";

/**
 * Short cinematic sequence for a cell's final moment.
 *
 * kind="broken"   → premature unlock: the visual cell breaks (money is safe).
 * kind="completed"→ success: light, pride, subtle particles.
 *
 * FUTURE: swap the CSS layers below for professional Lottie/GIF sequences
 * per cell type — the props and the onDone contract stay the same.
 */
export function CellOutcomeSequence({
  kind,
  cellType,
  onDone,
  className,
}: {
  kind: "broken" | "completed";
  cellType: CellTypeId;
  onDone?: (() => void) | undefined;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const meta = CELL_TYPE_MAP[cellType];
  const broken = kind === "broken";

  React.useEffect(() => {
    if (!onDone) return;
    const t = window.setTimeout(onDone, reducedMotion ? 900 : 2600);
    return () => window.clearTimeout(t);
  }, [onDone, reducedMotion]);

  const message = broken
    ? getVaultMessage("unlock_confirmed", { cellType }).text
    : getVaultMessage("cell_completed", { cellType }).text;

  return (
    <div className={cn("space-y-4 text-center", className)}>
      <div
        className={cn(
          "relative mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] border border-border/60 bg-vault/80 text-6xl",
          !reducedMotion && (broken ? "seq-break" : "seq-complete"),
          broken && "saturate-[0.6]",
        )}
      >
        <span className={cn("inline-flex", !reducedMotion && (broken ? "seq-break-icon" : "seq-complete-icon"))}>
          <CellTypeIcon type={cellType} className={broken ? "text-muted-foreground" : undefined} />
        </span>
        {!reducedMotion && broken && <span aria-hidden className="seq-crack" />}
        {!reducedMotion && !broken && (
          <>
            <span className="char-particle" style={{ left: "25%", animationDelay: "0s" }} />
            <span className="char-particle" style={{ left: "50%", animationDelay: "0.5s" }} />
            <span className="char-particle" style={{ left: "75%", animationDelay: "1s" }} />
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {broken ? BREAK_COPY[cellType] : COMPLETE_COPY}
      </p>

      <div className="flex justify-center">
        {broken ? (
          <MoneyCharacter mood="sad" size="md" />
        ) : (
          <MoneyCrowd mood="celebrating" count={3} />
        )}
      </div>

      <p className="text-sm font-medium">{message}</p>
      <p className="text-[11px] text-muted-foreground">
        Ломается только изображение ячейки. Реальные деньги VOLT не хранит и не трогает.
      </p>
    </div>
  );
}
