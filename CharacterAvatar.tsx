import { CHARACTER_STATE_META, type CharacterStateId } from "@/lib/volt/personality";
import { CELL_TYPE_MAP } from "@/lib/volt/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CellTypeId } from "@/lib/volt/types";
import { CellTypeIcon } from "./icons";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-12 w-12 text-2xl rounded-2xl",
  md: "h-16 w-16 text-3xl rounded-3xl",
  lg: "h-28 w-28 text-6xl rounded-[2rem]",
};

const chipSizes = {
  sm: "h-4 w-4 text-[9px] -bottom-1 -right-1",
  md: "h-5 w-5 text-[10px] -bottom-1 -right-1",
  lg: "h-7 w-7 text-sm -bottom-1.5 -right-1.5",
};

/**
 * Animated emotional avatar of a Cell's character.
 *
 * Motion is pure CSS (see `char-*` keyframes in styles.css) — no animation
 * libraries. Each state maps to one looping animation class plus a small
 * status chip. When the OS requests reduced motion, all animation is dropped
 * and the state is conveyed by the chip alone.
 *
 * FUTURE: the animated layer is intentionally a single swappable node —
 * replace the emoji span with a Lottie/GIF asset per (type, state) without
 * touching the state machine in lib/volt/personality.ts.
 */
export function CharacterAvatar({
  type,
  state = "idle",
  size = "md",
  className,
}: {
  type: CellTypeId;
  state?: CharacterStateId;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const meta = CELL_TYPE_MAP[type];
  const stateMeta = CHARACTER_STATE_META[state];
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn("relative shrink-0", className)}
      role="img"
      aria-label={`${meta.label} — ${stateMeta.label}`}
    >
      <div
        className={cn(
          "grid place-items-center border border-border/60 bg-vault/80",
          sizes[size],
        )}
        style={{
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.08), 0 8px 24px -14px oklch(0 0 0 / 0.8)",
        }}
      >
        <span
          className={cn("inline-flex drop-shadow", !reducedMotion && `char-anim-${state}`)}
        >
          <CellTypeIcon type={type} />
        </span>

        {/* Ambient effect layer (placeholder for future Lottie/GIF overlays) */}
        {!reducedMotion && state === "cooling" && (
          <span aria-hidden className="char-fx char-fx-snow" />
        )}
        {!reducedMotion && state === "celebrating" && (
          <span aria-hidden className="char-fx char-fx-sparkles" />
        )}
      </div>

      {/* State chip — always visible, so state survives reduced-motion */}
      <span
        aria-hidden
        className={cn(
          "absolute grid place-items-center rounded-full border border-border/60 bg-card",
          chipSizes[size],
          !reducedMotion && state === "worried" && "char-anim-chip-pulse",
        )}
      >
        {stateMeta.chip}
      </span>
    </div>
  );
}
