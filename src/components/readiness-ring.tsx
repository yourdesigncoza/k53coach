import { cn } from "@/lib/utils";
import type { ReadinessBand } from "@/lib/types";

/**
 * Band → gauge gradient (start, end). Not-ready reads red, almost-ready keeps
 * the signature amber→gold, test-ready reads green.
 */
const RING_GRADIENT: Record<ReadinessBand, [string, string]> = {
  "not-ready": ["#f0625f", "var(--destructive)"],
  "almost-ready": ["var(--amber-500)", "var(--gold-400)"],
  "test-ready": ["#43c98a", "var(--success)"],
};

/**
 * Band → solid fill for progress bars, as a CSS value. Set it as the
 * `--progress-fill` custom property on a <Progress> (or its container) to tint
 * the bar; the indicator falls back to `--primary` (gold) when unset.
 */
export const BAND_FILL: Record<ReadinessBand, string> = {
  "not-ready": "var(--destructive)",
  "almost-ready": "var(--primary)",
  "test-ready": "var(--success)",
};

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
  band,
  size = 200,
  stroke = 14,
  label,
  sublabel,
  fullTrack = false,
  tone = "surface",
  className,
}: {
  percent: number;
  /** Colours the gauge per band; defaults to amber→gold when omitted. */
  band?: ReadinessBand;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  /**
   * Centre-text colour.
   *
   * `surface` (default) uses the fixed `--surface-*` ink, which is right on the
   * white app panels the gauge was built for. `inverse` is for the dark
   * marketing zone, where that ink is all but invisible — the semantic
   * foreground flips and disappears there, so the landing must ask for white
   * explicitly rather than inherit.
   */
  tone?: "surface" | "inverse";
  /**
   * Draws the ring as a COMPLETE coloured circle regardless of `percent`.
   *
   * For the not-yet-measured state (John, 2026-08-06): a bare grey track reads
   * as broken or unstyled, while a finished circle reads as deliberate. The
   * centre still shows the real `percent`, so pass 0 and the gauge says 0%.
   */
  fullTrack?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = fullTrack ? 0 : c - (clamped / 100) * c;
  const [gradFrom, gradTo] = RING_GRADIENT[band ?? "almost-ready"];
  const gradId = `readinessGrad-${band ?? "default"}`;
  // The percentage used to be a fixed 36px at every diameter, which crowds the
  // small gauges (112–124px on the landing) while looking right at 150+. Scale
  // it with the ring, capped so the large gauges render exactly as before.
  const percentSize = Math.min(36, Math.round(size * 0.24));
  const inverse = tone === "inverse";

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={gradFrom} />
            <stop offset="1" stopColor={gradTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className={cn(
              "font-semibold tabular-nums leading-none tracking-tight",
              inverse ? "text-white" : "text-[var(--surface-ink)]",
            )}
            style={{ fontSize: percentSize }}
          >
            {clamped}%
          </div>
          {label && (
            <div
              className={cn(
                "mt-1 text-sm font-medium",
                inverse ? "text-white" : "text-[var(--surface-ink)]",
              )}
            >
              {label}
            </div>
          )}
          {sublabel && (
            <div
              className={cn(
                "mt-1 text-xs",
                inverse ? "text-white/75" : "text-[var(--surface-ink-2)]",
              )}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
