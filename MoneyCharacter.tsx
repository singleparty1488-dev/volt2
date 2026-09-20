import { MOOD_META, type MoodId } from "@/lib/volt/vaultMessages";
import { CELL_TYPE_MAP } from "@/lib/volt/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CellTypeId } from "@/lib/volt/types";
import { CellTypeIcon } from "./icons";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-7 w-7 text-sm",
  sm: "h-10 w-10 text-lg",
  md: "h-14 w-14 text-2xl",
  lg: "h-20 w-20 text-4xl",
};

/**
 * A single "money character" — a small inhabitant of the vault.
 *
 * FUTURE: this component is the single swap point for professional assets.
 * Replace the emoji layer with a Lottie/GIF/SVG per (cellType, mood); the
 * props contract and the mood state machine stay untouched.
 */
export function MoneyCharacter({
  mood = "calm",
  cellType,
  size = "md",
  className,
}: {
  mood?: MoodId | undefined;
  cellType?: CellTypeId | undefined;
  size?: keyof typeof sizes | undefined;
  className?: string | undefined;
}) {
  const reducedMotion = useReducedMotion();
  const meta = MOOD_META[mood];
  const typeMeta = cellType ? CELL_TYPE_MAP[cellType] : null;

  return (
    <div
      role="img"
      aria-label={typeMeta ? `${typeMeta.label} — ${meta.label}` : meta.label}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border border-border/60 bg-vault/80",
        sizes[size],
        className,
      )}
      style={{
        boxShadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.08), 0 8px 24px -14px oklch(0 0 0 / 0.8)",
      }}
    >
      <span className={cn("drop-shadow", !reducedMotion && `mood-anim-${mood}`)}>
        {meta.face}
      </span>
      {typeMeta && (
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-border/60 bg-card text-[10px]"
        >
          {cellType && <CellTypeIcon type={cellType} />}
        </span>
      )}
    </div>
  );
}

/** A small crowd of money characters — used in celebration / progress scenes. */
export function MoneyCrowd({
  mood = "calm",
  count = 3,
  className,
}: {
  mood?: MoodId;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end -space-x-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        // stagger so the crowd feels alive, not synced
        <span key={i} className="animate-fade-in" style={{ animationDelay: `${i * 90}ms` }}>
          <MoneyCharacter mood={mood} size="sm" />
        </span>
      ))}
    </div>
  );
}
