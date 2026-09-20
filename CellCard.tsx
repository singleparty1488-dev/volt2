import { Link } from "@tanstack/react-router";

import { CharacterAvatar } from "./CharacterAvatar";
import { GoalProgress } from "./GoalProgress";
import { ProtectionBadge } from "./ProtectionBadge";
import { COOLING_PERIODS, COOLING_WORDING } from "@/lib/volt/constants";
import { daysLeft, formatAmount, formatDateTime, pluralDays } from "@/lib/volt/format";
import { getCharacterState } from "@/lib/volt/personality";
import { useVolt } from "@/lib/volt/store";
import type { Cell } from "@/lib/volt/types";

const statusLabels: Record<Cell["status"], string> = {
  active: "",
  completed: "Завершена",
  prematurely_unlocked: "Открыта досрочно",
  archived: "В архиве",
};

export function CellCard({ cell }: { cell: Cell }) {
  const { state } = useVolt();
  const left = daysLeft(cell.unlockDate);
  const charState = getCharacterState(cell, state.unlockAttempts);

  return (
    <Link
      to="/cell/$cellId"
      params={{ cellId: cell.id }}
      className="block rounded-3xl border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-vault)] backdrop-blur transition-transform duration-200 active:scale-[0.985]"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <CharacterAvatar type={cell.type} state={charState} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-semibold">{cell.name}</h3>
            {cell.status !== "active" && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {statusLabels[cell.status]}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-2xl font-bold tracking-tight">
            {formatAmount(cell.amount, cell.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {cell.status === "active"
              ? `До разблокировки: ${pluralDays(left)}`
              : "Срок защиты завершён"}
          </p>
          {cell.status === "active" && cell.cooling && (
            <p className="mt-1 text-xs text-level-cooldown">
              {COOLING_WORDING[COOLING_PERIODS[cell.protectionLevel]?.kind ?? "cooling"].active} · до{" "}
              {formatDateTime(cell.cooling.endsAt)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ProtectionBadge level={cell.protectionLevel} />
      </div>

      {cell.goalAmount ? (
        <GoalProgress
          className="mt-3"
          current={cell.amount}
          target={cell.goalAmount}
          currency={cell.currency}
        />
      ) : null}
    </Link>
  );
}
