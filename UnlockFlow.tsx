import * as React from "react";

import { CellOutcomeSequence } from "./CellOutcomeSequence";
import { VaultReaction } from "./VaultReaction";
import { Button } from "@/components/ui/button";
import { COOLING_PERIODS, COOLING_WORDING, PROTECTION_LEVEL_MAP } from "@/lib/volt/constants";
import { formatCountdown, formatDateTime } from "@/lib/volt/format";
import { useVolt } from "@/lib/volt/store";
import { messageSeed } from "@/lib/volt/vaultMessages";
import type { Cell } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

const REASONS = [
  "Импульсивное желание",
  "Срочная необходимость",
  "Передумал(а) насчёт цели",
  "Другое",
];

type Step = "attempt" | "reason" | "cooling" | "confirm" | "outcome" | "cancelled";

/**
 * Psychological unlock flow with emotional reactions.
 * Intensity of the character's reaction scales with the protection level.
 */
export function UnlockFlow({ cell, onClose }: { cell: Cell; onClose: () => void }) {
  const { startCooling, resolveAttempt } = useVolt();
  const level = PROTECTION_LEVEL_MAP[cell.protectionLevel];
  // Waiting period comes from the single config in constants.ts:
  // cooldown → 60 min «охлаждение», iron → 24 h «заморозка».
  const period = COOLING_PERIODS[cell.protectionLevel];
  const wording = COOLING_WORDING[period?.kind ?? "cooling"];

  // Cooling is persisted on the cell: reopening the flow resumes it where it was.
  const [step, setStep] = React.useState<Step>(cell.cooling ? "cooling" : "attempt");
  const [reason, setReason] = React.useState<string | null>(cell.cooling?.reason ?? null);
  const [now, setNow] = React.useState(() => Date.now());
  const seconds = cell.cooling
    ? Math.max(0, Math.ceil((new Date(cell.cooling.endsAt).getTime() - now) / 1000))
    : 0;

  React.useEffect(() => {
    if (step !== "cooling") return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [step]);

  const goAfterAttempt = () => {
    if (cell.protectionLevel === "calm") setStep("confirm");
    else setStep("reason");
  };

  const afterReason = () => {
    if (period) {
      startCooling(cell.id, reason ?? undefined, period.seconds);
      setNow(Date.now());
      setStep("cooling");
    } else setStep("confirm");
  };

  const cancel = () => {
    resolveAttempt(cell.id, false, reason ?? undefined);
    setStep("cancelled");
  };

  const confirm = () => {
    if (resolveAttempt(cell.id, true, reason ?? undefined)) setStep("outcome");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/80 backdrop-blur-sm">
      <div className="animate-fade-in max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] border-t border-border/70 bg-card/95 p-5 pb-8 shadow-[var(--shadow-vault)]">
        {step === "attempt" && (
          <div className="space-y-5">
            <VaultReaction
              context="unlock_attempt"
              cellType={cell.type}
              protectionLevel={cell.protectionLevel}
            />
            <p className="text-xs text-muted-foreground">
              Уровень защиты: {level.label}. {level.description}
            </p>
            <Actions
              primary={{ label: "Оставить деньги", onClick: cancel }}
              secondary={{ label: "Всё равно открыть", onClick: goAfterAttempt }}
            />
          </div>
        )}

        {step === "reason" && (
          <div className="space-y-4">
            <VaultReaction context="unlock_attempt" cellType={cell.type} mood="worried"
              message="Скажи честно — что происходит? Это останется здесь, на устройстве." />
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left text-sm transition-colors",
                    reason === r
                      ? "border-primary/70 bg-primary/10"
                      : "border-border/70 bg-card/60",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {period && (
              <p className="rounded-2xl border border-border/70 bg-vault/60 px-4 py-3 text-xs text-muted-foreground">
                После этого шага начнётся {period.kind === "freeze" ? "заморозка" : "охлаждение"}:{" "}
                {period.label} ожидания. Таймер сохраняется — можно закрыть приложение и вернуться
                позже.
              </p>
            )}
            <Actions
              primary={{ label: "Оставить деньги", onClick: cancel }}
              secondary={{ label: "Продолжить", onClick: afterReason, disabled: !reason }}
            />
          </div>
        )}

        {step === "cooling" && (
          <div className="space-y-5">
            {/* Stable seed: the timer re-renders every second, the line must not flicker. */}
            <VaultReaction
              context="cooling"
              cellType={cell.type}
              protectionLevel={cell.protectionLevel}
              seed={messageSeed(cell.id)}
            />
            <div className="rounded-3xl border border-border/70 bg-vault/60 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {wording.title}
              </p>
              <p
                role="timer"
                aria-label={`Осталось ${formatCountdown(seconds)}`}
                className="mt-2 text-4xl font-black tabular-nums"
              >
                {formatCountdown(seconds)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {seconds > 0 ? "до возможности принять решение" : "Период завершён — решение за вами"}
              </p>
              {cell.cooling && seconds > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Решить можно будет {formatDateTime(cell.cooling.endsAt)}. Таймер идёт, даже если
                  закрыть приложение.
                </p>
              )}
            </div>
            <Actions
              primary={{ label: "Передумал(а) — оставить", onClick: cancel }}
              secondary={{
                label: seconds > 0 ? "Подождите…" : "Перейти к решению",
                onClick: () => setStep("confirm"),
                disabled: seconds > 0,
              }}
              tertiary={{ label: "Свернуть — вернусь позже", onClick: onClose }}
            />
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-5">
            <VaultReaction
              context="unlock_attempt"
              cellType={cell.type}
              protectionLevel={cell.protectionLevel}
              mood={cell.protectionLevel === "iron" ? "sad" : "worried"}
              message={
                cell.protectionLevel === "iron"
                  ? "Ты сам попросил меня охранять эти деньги… Последний шаг за тобой."
                  : "Последний шаг. Решение всё ещё можно отменить."
              }
            />
            <Actions
              primary={{ label: "Оставить деньги под защитой", onClick: cancel }}
              secondary={{ label: "Открыть досрочно", onClick: confirm, danger: true }}
            />
          </div>
        )}

        {step === "cancelled" && (
          <div className="space-y-5">
            <VaultReaction context="unlock_cancelled" cellType={cell.type} mood="calm" />
            <Button className="w-full rounded-2xl py-6" onClick={onClose}>
              Готово
            </Button>
          </div>
        )}

        {step === "outcome" && (
          <div className="space-y-5">
            <CellOutcomeSequence kind="broken" cellType={cell.type} />
            <Button className="w-full rounded-2xl py-6" variant="secondary" onClick={onClose}>
              В хранилище
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Actions({
  primary,
  secondary,
  tertiary,
}: {
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean };
  tertiary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="space-y-2">
      <Button className="w-full rounded-2xl py-6 text-base font-semibold" onClick={primary.onClick}>
        {primary.label}
      </Button>
      <Button
        variant="ghost"
        className={cn("w-full rounded-2xl", secondary.danger && "text-destructive")}
        disabled={secondary.disabled ?? false}
        onClick={secondary.onClick}
      >
        {secondary.label}
      </Button>
      {tertiary && (
        <Button
          variant="ghost"
          className="w-full rounded-2xl text-muted-foreground"
          onClick={tertiary.onClick}
        >
          {tertiary.label}
        </Button>
      )}
    </div>
  );
}
