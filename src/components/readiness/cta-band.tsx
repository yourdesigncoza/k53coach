import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Gold-glow CTA band used at the foot of the public enticement pages
 * (assessment demo, sample lesson). Dark storefront styling — render it inside
 * a `theme-dark` page. One title, one subtitle, one primary action; no
 * secondary link, so both pages read identically.
 */
export function CtaBand({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle: string;
  action: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-gold-400/40 px-6 py-12 text-center shadow-[var(--glow-gold)] md:py-14",
        className,
      )}
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, rgba(255,196,107,.14), transparent 60%), var(--ink-800)",
      }}
    >
      <h2 className="mx-auto max-w-md font-display text-[1.5rem] font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mist">{subtitle}</p>
      <Button
        className="mx-auto mt-7 h-12 w-full max-w-xs rounded-[14px] px-6 text-base font-display font-semibold"
        render={
          <Link href={action.href}>
            {action.label} <ArrowRight className="size-4" />
          </Link>
        }
      />
    </div>
  );
}
