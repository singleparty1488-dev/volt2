import * as React from "react";
import { Delete, Fingerprint, Lock, ShieldCheck, Timer, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVolt } from "@/lib/volt/store";
import { BETA_DISCLAIMER } from "@/lib/volt/constants";
import { isBiometricSupported } from "@/lib/volt/biometrics";

/** Entry protection: first-run security setup + PIN / biometric unlock. */
export function LockScreen() {
  const { state, locked, unlock, updateSecurity, verifyPin, unlockWithBiometric } = useVolt();
  const { security } = state;
  const pinActive = security.pinEnabled && !!security.pinHash;

  if (!security.onboarded) return <SecurityOnboarding />;
  if (locked && pinActive) {
    return (
      <PinPad
        title="Введите PIN-код"
        verify={verifyPin}
        biometricEnabled={security.biometricEnabled && !!security.credentialId}
        onBiometric={unlockWithBiometric}
        onSuccess={unlock}
      />
    );
  }
  if (locked && !pinActive) {
    return (
      <Centered>
        <ShieldCheck className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 text-2xl font-bold">VOLT заблокирован</h1>
        <Button className="mt-6 w-full" onClick={unlock}>
          Войти
        </Button>
        <button
          className="mt-3 text-xs text-muted-foreground underline"
          onClick={() => updateSecurity({ pinEnabled: false })}
        >
          Настроить защиту позже
        </button>
      </Centered>
    );
  }
  return null;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-vault-deep px-6">
      <div className="w-full max-w-xs text-center">{children}</div>
    </div>
  );
}

function SecurityOnboarding() {
  const { updateSecurity, setPin, enableBiometric } = useVolt();
  const [step, setStep] = React.useState<"intro" | "pin" | "repeat">("intro");
  const [first, setFirst] = React.useState("");
  const [bioSupported, setBioSupported] = React.useState(false);

  React.useEffect(() => {
    isBiometricSupported().then(setBioSupported);
  }, []);

  if (step === "pin")
    return (
      <PinPad
        title="Придумайте PIN-код"
        subtitle="4 цифры для входа в VOLT"
        onComplete={(code) => {
          setFirst(code);
          setStep("repeat");
        }}
      />
    );

  if (step === "repeat")
    return (
      <PinPad
        title="Повторите PIN-код"
        expected={first}
        onSuccess={async () => {
          // Real WebAuthn registration (OS biometric prompt); PIN still works if it's refused.
          if (bioSupported) await enableBiometric();
          await setPin(first);
        }}
        onMismatch={() => setStep("pin")}
      />
    );

  return (
    <Centered>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gold/15 text-gold">
        <ShieldCheck className="h-8 w-8" strokeWidth={1.6} aria-hidden />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight">VOLT</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Личное хранилище для денег, которые вы решили не трогать.
      </p>
      <div className="mt-6 space-y-3 text-left text-sm">
        <Row icon={Lock} text="PIN-код на вход в приложение" />
        <Row icon={Fingerprint} text={bioSupported ? "Биометрия устройства, если доступна" : "Биометрия недоступна в этом браузере"} />
        <Row icon={Timer} text="Автоблокировка при бездействии" />
      </div>
      <Button className="mt-7 w-full" onClick={() => setStep("pin")}>
        Настроить защиту
      </Button>
      <button
        className="mt-3 text-xs text-muted-foreground underline"
        onClick={() => updateSecurity({ onboarded: true })}
      >
        Пропустить
      </button>
      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">{BETA_DISCLAIMER}</p>
    </Centered>
  );
}

function Row({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-3 py-2.5">
      <Icon className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
      <span className="min-w-0 text-muted-foreground">{text}</span>
    </div>
  );
}

export function PinPad({
  title,
  subtitle,
  expected,
  verify,
  biometricEnabled,
  onBiometric,
  onComplete,
  onSuccess,
  onMismatch,
}: {
  title: string;
  subtitle?: string;
  expected?: string;
  /** Async check with lockout (used for the real PIN). */
  verify?: (code: string) => Promise<{ ok: boolean; retryInMs?: number }>;
  biometricEnabled?: boolean;
  onBiometric?: () => Promise<boolean> | void;
  onComplete?: (code: string) => void;
  onSuccess?: () => void;
  onMismatch?: () => void;
}) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState(false);
  const [blockedUntil, setBlockedUntil] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const blocked = blockedUntil > now;

  React.useEffect(() => {
    if (!blocked) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [blocked]);

  const fail = (retryInMs?: number) => {
    if (retryInMs) {
      setBlockedUntil(Date.now() + retryInMs);
      setNow(Date.now());
    }
    setError(true);
    setTimeout(() => {
      setError(false);
      setCode("");
      onMismatch?.();
    }, 500);
  };

  const submit = async (value: string) => {
    if (verify) {
      const r = await verify(value);
      if (r.ok) {
        onSuccess?.();
        setCode("");
      } else fail(r.retryInMs);
      return;
    }
    if (expected === undefined) {
      onComplete?.(value);
      setCode("");
      return;
    }
    if (value === expected) {
      onSuccess?.();
      setCode("");
    } else fail();
  };

  const press = (digit: string) => {
    if (blocked || code.length >= 4) return;
    const next = code + digit;
    setCode(next);
    if (next.length === 4) setTimeout(() => void submit(next), 120);
  };

  return (
    <Centered>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {blocked && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Слишком много попыток. Подождите {Math.ceil((blockedUntil - now) / 1000)} с.
        </p>
      )}

      <div className={`mt-8 flex justify-center gap-4 ${error ? "animate-pulse" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border transition-colors ${
              error
                ? "border-destructive bg-destructive"
                : i < code.length
                  ? "border-gold bg-gold"
                  : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PinKey key={d} onClick={() => press(d)}>
            {d}
          </PinKey>
        ))}
        <div className="grid place-items-center">
          {biometricEnabled && (
            <button
              type="button"
              aria-label="Войти по биометрии"
              onClick={() => void onBiometric?.()}
              className="grid h-14 w-14 place-items-center rounded-2xl text-gold"
            >
              <Fingerprint className="h-6 w-6" />
            </button>
          )}
        </div>
        <PinKey onClick={() => press("0")}>0</PinKey>
        <div className="grid place-items-center">
          <button
            type="button"
            aria-label="Удалить"
            onClick={() => setCode((c) => c.slice(0, -1))}
            className="grid h-14 w-14 place-items-center rounded-2xl text-muted-foreground"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Centered>
  );
}

function PinKey({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border/60 bg-card/70 text-xl font-semibold transition-transform active:scale-95"
    >
      {children}
    </button>
  );
}
