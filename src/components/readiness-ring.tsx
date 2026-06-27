import { cn } from "@/lib/utils";
import type { ReadinessBand } from "@/lib/types";

/** Soft tinted pill per readiness band — the Catalyst badge treatment. */
export const BAND_BADGE_CLASS: Record<ReadinessBand, string> = {
  "not-ready":
    "bg-destructive/10 text-destructive dark:bg-destructive/20",
  "almost-ready":
    "bg-warning/15 text-warning-foreground/90 dark:bg-warning/20 [&]:text-amber-700 dark:[&]:text-amber-300",
  "test-ready":
    "[&]:text-emerald-700 dark:[&]:text-emerald-300 bg-success/10 dark:bg-success/20",
};

/**
 * Monochrome circular readiness gauge — the signature element.
 * The ring itself stays ink; the band (not-ready / almost / ready) is shown as
 * a soft pill so the gauge reads clean.
 */
export function ReadinessRing({
  percent,
  size = 200,
  stroke = 14,
  label,
  sublabel,
  className,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-semibold tabular-nums tracking-tight">
            {clamped}%
          </div>
          {label && (
            <div className="mt-1 text-sm font-medium text-foreground">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
