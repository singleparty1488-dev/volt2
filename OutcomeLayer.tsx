import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CellStatus } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

/**
 * Placeholder cinematic layer for a cell's final outcome.
 *
 * - completed → warm golden glow + rising particles
 * - prematurely_unlocked → cool dim "cracked glass" veil
 *
 * FUTURE: this component is the designated swap point for professional
 * animation — replace the CSS particles with Lottie/GIF destruction or
 * celebration sequences per cell type; the props contract stays the same.
 */
export function OutcomeLayer({
  status,
  className,
}: {
  status: CellStatus;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (status !== "completed" && status !== "prematurely_unlocked") return null;

  const completed = status === "completed";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        completed ? "char-outcome-complete" : "char-outcome-broken",
        className,
      )}
    >
      {!reducedMotion && completed && (
        <>
          <span className="char-particle" style={{ left: "18%", animationDelay: "0s" }} />
          <span className="char-particle" style={{ left: "38%", animationDelay: "0.9s" }} />
          <span className="char-particle" style={{ left: "55%", animationDelay: "0.4s" }} />
          <span className="char-particle" style={{ left: "72%", animationDelay: "1.4s" }} />
          <span className="char-particle" style={{ left: "86%", animationDelay: "0.6s" }} />
        </>
      )}
    </div>
  );
}
