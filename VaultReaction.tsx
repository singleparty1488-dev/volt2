import { MoneyCharacter } from "./MoneyCharacter";
import { CharacterBubble } from "./CharacterBubble";
import { getVaultMessage, type MoodId, type ReactionContext } from "@/lib/volt/vaultMessages";
import type { CellTypeId, ProtectionLevelId } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

/**
 * Reusable emotional reaction: a money character + a line of microcopy.
 *
 * All text comes from lib/volt/vaultMessages.ts; all motion is CSS.
 */
export function VaultReaction({
  context,
  cellType,
  protectionLevel,
  seed,
  message,
  mood,
  size = "md",
  className,
}: {
  context: ReactionContext;
  cellType?: CellTypeId;
  protectionLevel?: ProtectionLevelId;
  /** Provide for a deterministic (day-stable) message; omit for a random one. */
  seed?: number;
  /** Optional override of the generated text. */
  message?: string;
  /** Optional override of the generated mood. */
  mood?: MoodId;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const generated = getVaultMessage(context, { cellType, protectionLevel, seed });

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <MoneyCharacter
        mood={mood ?? generated.mood}
        cellType={cellType}
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"}
      />
      <CharacterBubble text={message ?? generated.text} className="min-w-0 flex-1" />
    </div>
  );
}
