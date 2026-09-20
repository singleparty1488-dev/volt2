import type { ReactNode } from "react";
import { Lock, Snowflake, ShieldCheck, Unlock, type LucideIcon } from "lucide-react";

import type { CellTypeId, ProtectionLevelId } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

/**
 * One cohesive line-icon family for the five cell types (24px grid, 1.6 stroke, round caps).
 * Sized in `em`, so they scale with the surrounding text-size classes used by the avatars.
 */
const CELL_PATHS: Record<CellTypeId, ReactNode> = {
  glass_house: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V19h12V9.5" />
      <path d="M10 19v-4.5h4V19" />
      <path d="M8.2 12.2 9.6 10.8" />
    </>
  ),
  piggy_bank: (
    <>
      <path d="M5 12.5C5 9.5 8 7.5 12 7.5c3.4 0 6 1.5 6.7 4 .8.3 1.3 1 1.3 1.9v1.4h-2l-.8 2.2h-2l-.5-1.3h-5l-.5 1.3H7.4l-.8-2.3C5.6 14.4 5 13.6 5 12.5Z" />
      <path d="M14.2 5.6 14.8 7.6" />
      <path d="M10 10.2h3.4" />
      <circle cx="16.2" cy="11.4" r=".55" fill="currentColor" stroke="none" />
    </>
  ),
  jar: (
    <>
      <path d="M8 4h8" />
      <path d="M8.5 4v2.4C6.8 7.4 6 8.7 6 10.4V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7.6c0-1.7-.8-3-2.5-4V4" />
      <path d="M6.3 11.5h11.4" />
      <circle cx="12" cy="15.6" r="1.7" />
    </>
  ),
  money_plant: (
    <>
      <path d="M7.5 15h9l-1 5h-7l-1-5Z" />
      <path d="M12 15V9.5" />
      <path d="M12 11.2c0-2.5-2-4.2-4.6-4.2 0 2.6 1.9 4.2 4.6 4.2Z" />
      <path d="M12 9c0-2.5 1.8-4 4.6-4 0 2.5-1.8 4-4.6 4Z" />
    </>
  ),
  safe: (
    <>
      <rect x="4" y="5" width="16" height="13" rx="2" />
      <circle cx="12" cy="11.5" r="3" />
      <path d="M12 9.6v1.9l1.2 1" />
      <path d="M7 18v2M17 18v2" />
    </>
  ),
};

export function CellTypeIcon({ type, className }: { type: CellTypeId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-[1em] w-[1em] text-gold", className)}
    >
      {CELL_PATHS[type]}
    </svg>
  );
}

const LEVEL_ICONS: Record<ProtectionLevelId, LucideIcon> = {
  calm: Unlock,
  mindful: Lock,
  cooldown: Snowflake,
  iron: ShieldCheck,
};

export function LevelIcon({ level, className }: { level: ProtectionLevelId; className?: string }) {
  const Icon = LEVEL_ICONS[level];
  return <Icon aria-hidden className={cn("h-3.5 w-3.5", className)} />;
}
