import * as React from "react";
import { ArrowLeft, Check, X } from "lucide-react";

import { CellVisual } from "./CellVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BETA_DISCLAIMER,
  CELL_TYPES,
  CELL_TYPE_MAP,
  GOAL_PRESETS,
  PROTECTION_LEVELS,
  PROTECTION_LEVEL_MAP,
} from "@/lib/volt/constants";
import { addDays, formatAmount, formatDate, pluralDays } from "@/lib/volt/format";
import { useVolt } from "@/lib/volt/store";
import type { CellTypeId, ProtectionLevelId } from "@/lib/volt/types";
import { cn } from "@/lib/utils";

const STEPS = ["Тип", "Название", "Сумма", "Защита", "Срок", "Цель", "Итог"] as const;

interface Draft {
  type: CellTypeId;
  name: string;
  amount: string;
  level: ProtectionLevelId | null;
  unlockKind: "days" | "date";
  days: string;
  date: string;
  goalPreset: string | null;
  goalCustom: string;
  goalAmount: string;
}

const emptyDraft: Draft = {
  type: "glass_house",
  name: "",
  amount: "",
  level: null,
  unlockKind: "days",
  days: "30",
  date: "",
  goalPreset: null,
  goalCustom: "",
  goalAmount: "",
};

export function CreateCellSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (cellId: string) => void;
}) {
  const { addCell, state } = useVolt();
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setDraft(emptyDraft);
    }
  }, [open]);

  if (!open) return null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const amountNumber = Number(draft.amount.replace(/\s/g, "")) || 0;
  const goalAmountNumber = Number(draft.goalAmount.replace(/\s/g, "")) || 0;
  const resolvedDate =
    draft.unlockKind === "days"
      ? addDays(Number(draft.days) || 0)
      : draft.date
        ? new Date(draft.date).toISOString()
        : "";
  const goalLabel =
    draft.goalPreset === "custom"
      ? draft.goalCustom.trim()
      : (GOAL_PRESETS.find((g) => g.key === draft.goalPreset)?.label ?? "");

  const canContinue = [
    true,
    draft.name.trim().length > 0,
    amountNumber > 0,
    draft.level !== null,
    Boolean(resolvedDate),
    true,
    true,
  ][step];

  const create = () => {
    const goal = goalLabel
      ? {
          preset: draft.goalPreset ?? "custom",
          label: goalLabel,
          ...(goalAmountNumber ? { targetAmount: goalAmountNumber } : {}),
        }
      : undefined;

    const cell = addCell({
      name: draft.name.trim(),
      type: draft.type,
      amount: amountNumber,
      currency: state.user.currency,
      protectionLevel: draft.level!,
      unlockDate: resolvedDate,
      ...(draft.unlockKind === "days" ? { durationDays: Number(draft.days) } : {}),
      ...(goal ? { goal } : {}),
      ...(goalAmountNumber ? { goalAmount: goalAmountNumber } : {}),
    });
    onOpenChange(false);
    onCreated?.(cell.id);
  };


  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-vault-deep">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-3">
        <button
          type="button"
          aria-label="Назад"
          onClick={() => (step === 0 ? onOpenChange(false) : setStep((s) => s - 1))}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary/70"
        >
          {step === 0 ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">Создать ячейку</p>
          <p className="text-[11px] text-muted-foreground">
            Шаг {step + 1} из {STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <div className="h-9 w-9" />
      </header>

      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-gold transition-[width] duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          {step === 0 && (
            <>
              <StepTitle title="Выберите тип ячейки" hint="Это ваш личный контейнер для денег" />
              <div className="grid gap-3">
                {CELL_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("type", t.id)}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border p-3 text-left transition-colors",
                      draft.type === t.id
                        ? "border-gold/60 bg-card"
                        : "border-border/60 bg-card/50",
                    )}
                  >
                    <CellVisual type={t.id} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
                    </div>
                    {draft.type === t.id && <Check className="h-4 w-4 shrink-0 text-gold" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepTitle title="Как назовём ячейку?" hint="Например: Отпуск" />
              <Input
                autoFocus
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Отпуск"
                maxLength={40}
                className="h-14 rounded-2xl text-lg"
              />
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle
                title="Какую сумму защищаем?"
                hint="Сумму вы вводите вручную — VOLT не подключается к банку"
              />
              <div className="flex items-center gap-2 rounded-3xl border border-border/60 bg-card/60 px-4 py-5">
                <input
                  autoFocus
                  inputMode="numeric"
                  value={draft.amount}
                  onChange={(e) => set("amount", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="25000"
                  className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50"
                />
                <span className="shrink-0 text-2xl font-bold text-muted-foreground">₴</span>
              </div>
              <p className="text-xs text-muted-foreground">{BETA_DISCLAIMER}</p>
            </>
          )}

          {step === 3 && (
            <>
              <StepTitle title="Уровень защиты" hint="Чем строже уровень, тем сложнее открыть ячейку раньше срока" />
              <div className="grid gap-3">
                {PROTECTION_LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => set("level", l.id)}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition-colors",
                      draft.level === l.id ? "border-gold/60 bg-card" : "border-border/60 bg-card/50",
                    )}
                  >
                    <p className="text-sm font-semibold">
                      <span className="mr-2">{l.dot}</span>
                      {l.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
                  </button>
                ))}
              </div>
              <Warning />
            </>
          )}

          {step === 4 && (
            <>
              <StepTitle title="Когда ячейку можно открыть?" />
              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  active={draft.unlockKind === "days"}
                  onClick={() => set("unlockKind", "days")}
                  label="Через N дней"
                />
                <Toggle
                  active={draft.unlockKind === "date"}
                  onClick={() => set("unlockKind", "date")}
                  label="Конкретная дата"
                />
              </div>
              {draft.unlockKind === "days" ? (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Количество дней</Label>
                  <Input
                    inputMode="numeric"
                    value={draft.days}
                    onChange={(e) => set("days", e.target.value.replace(/[^\d]/g, ""))}
                    className="h-14 rounded-2xl text-lg"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[30, 60, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set("days", String(d))}
                        className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs"
                      >
                        {d} дн.
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Дата разблокировки</Label>
                  <Input
                    type="date"
                    value={draft.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="h-14 rounded-2xl text-lg"
                  />
                </div>
              )}
              {resolvedDate && (
                <p className="text-xs text-muted-foreground">
                  Разблокировка: {formatDate(resolvedDate)}
                </p>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <StepTitle title="Цель" hint="Необязательный шаг" />
              <div className="flex flex-wrap gap-2">
                {GOAL_PRESETS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => set("goalPreset", draft.goalPreset === g.key ? null : g.key)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm transition-colors",
                      draft.goalPreset === g.key
                        ? "border-gold/60 bg-gold/10 text-gold"
                        : "border-border/60 bg-card/50 text-muted-foreground",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {draft.goalPreset === "custom" && (
                <Input
                  value={draft.goalCustom}
                  onChange={(e) => set("goalCustom", e.target.value)}
                  placeholder="Своя цель"
                  className="h-12 rounded-2xl"
                />
              )}
              {draft.goalPreset && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Сумма цели (необязательно)
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={draft.goalAmount}
                    onChange={(e) => set("goalAmount", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="50000"
                    className="h-12 rounded-2xl"
                  />
                </div>
              )}
            </>
          )}

          {step === 6 && (
            <>
              <StepTitle title="Проверьте ячейку" />
              <div className="rounded-3xl border border-border/60 bg-card/70 p-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                  <CellVisual type={draft.type} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{draft.name}</p>
                    <p className="text-2xl font-bold">{formatAmount(amountNumber)}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <SummaryRow label="Тип ячейки" value={CELL_TYPE_MAP[draft.type].label} />
                  <SummaryRow
                    label="Уровень защиты"
                    value={draft.level ? PROTECTION_LEVEL_MAP[draft.level].label : "—"}
                  />
                  <SummaryRow
                    label="Разблокировка"
                    value={
                      resolvedDate
                        ? `${formatDate(resolvedDate)}${
                            draft.unlockKind === "days" ? ` · ${pluralDays(Number(draft.days))}` : ""
                          }`
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Цель"
                    value={
                      goalLabel
                        ? goalAmountNumber
                          ? `${goalLabel} · ${formatAmount(goalAmountNumber)}`
                          : goalLabel
                        : "Без цели"
                    }
                  />
                </dl>
              </div>
              <Warning />
              <p className="text-xs text-muted-foreground">{BETA_DISCLAIMER}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          className="h-13 w-full rounded-2xl py-6 text-base font-semibold"
          disabled={!canContinue}
          onClick={() => (step === STEPS.length - 1 ? create() : setStep((s) => s + 1))}
        >
          {step === STEPS.length - 1 ? "Создать ячейку" : "Продолжить"}
        </Button>
      </div>
    </div>
  );
}

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Warning() {
  return (
    <p className="rounded-2xl border border-level-cooldown/30 bg-level-cooldown/10 px-4 py-3 text-xs text-level-cooldown">
      После создания уровень защиты изменить нельзя.
    </p>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-3 text-sm transition-colors",
        active ? "border-gold/60 bg-gold/10 text-gold" : "border-border/60 bg-card/50 text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
