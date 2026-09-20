import { Sparkles, Leaf } from "lucide-react";

import { cn } from "@/lib/utils";

export function InsightCard({
  text,
  tone = "neutral",
  className,
}: {
  text: string;
  tone?: "neutral" | "positive";
  className?: string;
}) {
  const Icon = tone === "positive" ? Leaf : Sparkles;
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-3xl border p-4",
        tone === "positive"
          ? "border-mint/30 bg-mint/5"
          : "border-border/60 bg-card/60",
        className,
      )}
    >
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-2xl",
          tone === "positive" ? "bg-mint/15 text-mint" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
