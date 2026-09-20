import { cn } from "@/lib/utils";

/**
 * Speech bubble for a Cell character. Pure presentational — the text always
 * comes from lib/volt/personality.ts so all voice lines stay in one place.
 */
export function CharacterBubble({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in relative rounded-3xl rounded-tl-md border border-border/60 bg-card/80 px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow-vault)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -left-px top-3 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-l border-border/60 bg-card/80"
      />
      {text}
    </div>
  );
}
