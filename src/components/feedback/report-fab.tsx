"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Bug } from "lucide-react";

import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/feedback/report-dialog";
import {
  hasCapturedProblem,
  onTelemetryCapture,
} from "@/components/feedback/feedback-telemetry";

/**
 * General bug reporter for the signed-in app shell.
 *
 * A labelled pill, not an icon-only circle. The first version was a bare bug
 * glyph on a beige disc against a beige canvas — findable only if you already
 * knew it was there, which is exactly backwards for the one control a stuck
 * learner needs. The word "bug" is what makes it a button; the icon alone is
 * decoration.
 *
 * The status dot is a real signal, not a decoration: it turns amber once this
 * page load has actually recorded a JS error or a failed request, so a learner
 * who suspects something broke gets confirmation that we noticed too — and the
 * report they file is the one carrying that evidence.
 */
export function ReportFab() {
  const t = useTranslations("feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Subscribed rather than polled — the telemetry buffer tells us when it
  // captures something. The third argument is the server snapshot, which React
  // also uses for the hydrating render, so SSR and first paint agree without a
  // mounted flag; the real value arrives on the first capture after hydration.
  const flagged = useSyncExternalStore(
    onTelemetryCapture,
    hasCapturedProblem,
    () => false,
  );

  // During a live, timed mock exam the pill collapses to its icon. A learner
  // mid-paper should not have a word-width target floating over the answers,
  // and the clock is running — but if something IS breaking, that is precisely
  // when they most need to reach this, so it never disappears entirely.
  const compact = pathname.startsWith("/mock/exam");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // The dot's state is colour + animation only, so it must also reach the
        // accessible name — otherwise a screen-reader user gets no signal at all.
        aria-label={flagged ? `${t("fabLabel")} — ${t("fabProblemHint")}` : t("fabLabel")}
        title={flagged ? t("fabProblemHint") : t("fabLabel")}
        className={cn(
          // Sits 16px above the mobile tab bar. The bar is h-16 PLUS `pb-safe`,
          // so the offset has to carry the same inset — a flat `bottom-20` looks
          // right in a desktop viewport and slides the button behind the bar on
          // any device with a home indicator.
          "fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40",
          "inline-flex items-center rounded-full",
          "border border-[var(--surface-border-2)] bg-[var(--surface)]",
          "shadow-[0_6px_20px_-6px_rgb(34_24_19/0.35)]",
          "transition-all duration-150 outline-none",
          "hover:-translate-y-px hover:border-[var(--gold-400)] hover:shadow-[0_10px_24px_-6px_rgb(34_24_19/0.45)]",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "active:translate-y-0",
          "md:right-6 md:bottom-6",
          compact ? "gap-0 p-3" : "gap-2 py-2.5 pr-3 pl-3.5",
        )}
      >
        <Bug className="size-4 shrink-0 text-[var(--gold-ink)]" />
        {!compact && (
          <span className="text-sm font-medium whitespace-nowrap text-foreground">
            {t("fabLabel")}
          </span>
        )}
        {/* Green resting, red once the page has actually thrown. The first
            version used gold vs amber — both orange, indistinguishable at 10px,
            so the signal carried no information. A status dot that cannot be
            read at a glance is decoration. */}
        <span
          aria-hidden
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            compact && "absolute top-1.5 right-1.5 size-2",
            flagged
              ? "bg-[var(--destructive)] ring-2 ring-[var(--danger-soft)] motion-safe:animate-pulse"
              : "bg-[var(--success)]",
          )}
        />
      </button>

      <ReportDialog kind="bug" open={open} onOpenChange={setOpen} />
    </>
  );
}
