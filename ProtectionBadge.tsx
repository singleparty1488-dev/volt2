import { PROTECTION_LEVEL_MAP } from "@/lib/volt/constants";
import type { ProtectionLevelId } from "@/lib/volt/types";
import { LevelIcon } from "./icons";
import { cn } from "@/lib/utils";

const colorByLevel: Record<ProtectionLevelId, string> = {
  calm: "text-level-calm",
  mindful: "text-level-mindful",
  cooldown: "text-level-cooldown",
  iron: "text-level-iron",
};

export function ProtectionBadge({
  level,
  className,
}: {
  level: ProtectionLevelId;
  className?: string;
}) {
  const meta = PROTECTION_LEVEL_MAP[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs font-medium",
        colorByLevel[level],
        className,
      )}
    >
      <LevelIcon level={level} />
      {meta.label} уровень
    </span>
  );
}
