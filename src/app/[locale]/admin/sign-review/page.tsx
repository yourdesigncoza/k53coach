import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { SignRowLink } from "@/components/admin/sign-row";
import { getSigns } from "@/lib/supabase/queries";
import {
  SIGN_CATEGORY_LABEL,
  SIGN_CATEGORY_ORDER,
  isShippable,
} from "@/lib/signs";

export const metadata = { title: "Admin · Sign review" };

export default async function SignReviewPage() {
  const signs = await getSigns();
  const shippable = signs.filter(isShippable).length;

  // Excluded (not SA-relevant) signs come FIRST so they're easy to re-triage.
  const excluded = signs
    .filter((s) => s.sa_relevant === false)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  // Everything else, grouped by category (served + in-review, no excluded).
  const byCategory = SIGN_CATEGORY_ORDER.map((cat) => ({
    cat,
    signs: signs.filter((s) => s.category === cat && s.sa_relevant !== false),
  })).filter((g) => g.signs.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to admin
      </Link>
      <h1 className="text-xl font-semibold md:text-2xl">Sign review</h1>
      <p className="text-sm text-muted-foreground">
        {signs.length} signs · {shippable} shippable · {excluded.length} excluded
        (not in chart). Click any sign to edit.
      </p>

      {excluded.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Excluded ({excluded.length}) — not served; reason shown where recorded
          </h2>
          <div className="grid gap-2">
            {excluded.map((s) => (
              <SignRowLink key={s.code} sign={s} />
            ))}
          </div>
        </section>
      )}

      {byCategory.map(({ cat, signs }) => (
        <section key={cat} className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {SIGN_CATEGORY_LABEL[cat]} ({signs.length})
          </h2>
          <div className="grid gap-2">
            {signs.map((s) => (
              <SignRowLink key={s.code} sign={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
