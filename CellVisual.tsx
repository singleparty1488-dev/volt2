import { CELL_TYPE_MAP } from "@/lib/volt/constants";
import type { CellTypeId } from "@/lib/volt/types";
import { CellTypeIcon } from "./icons";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-12 w-12 text-2xl rounded-2xl",
  md: "h-16 w-16 text-3xl rounded-3xl",
  lg: "h-28 w-28 text-6xl rounded-[2rem]",
};

/**
 * Visual container of a Cell. `progressState` (0..4) is reserved for the
 * future evolution system — for now it only tunes the glow intensity.
 */
export function CellVisual({
  type,
  size = "md",
  progressState = 0,
  className,
}: {
  type: CellTypeId;
  size?: keyof typeof sizes;
  progressState?: number;
  className?: string;
}) {
  const meta = CELL_TYPE_MAP[type];
  const glow = 0.12 + Math.min(progressState, 4) * 0.06;

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center border border-border/60 bg-vault/80 transition-transform duration-300",
        sizes[size],
        className,
      )}
      style={{ boxShadow: `inset 0 1px 0 oklch(1 0 0 / 0.08), 0 8px 24px -14px oklch(0 0 0 / ${glow + 0.6})` }}
      aria-label={meta.label}
      role="img"
    >
      <CellTypeIcon type={type} className="drop-shadow" />
    </div>
  );
}
