import { Link } from "@/i18n/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { SignRowLink } from "@/components/admin/sign-row";
import { Card, CardContent } from "@/components/ui/card";
import { getSigns } from "@/lib/supabase/queries";
import {
  SIGN_CATEGORY_LABEL,
  SIGN_CATEGORY_ORDER,
  isShippable,
} from "@/lib/signs";
import { chartCoverage } from "@/lib/coverage";

export const metadata = { title: "Admin · Sign review" };

export default async function SignReviewPage() {
  const signs = await getSigns();
  const shippable = signs.filter(isShippable).length;
  const cov = chartCoverage(signs);

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

      <section className="mt-10 border-t border-border pt-6">
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Source of truth — official DoT sign chart</p>
                <p className="mt-1 text-muted-foreground">
                  Coverage is measured against{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    init/RTSigns_charts.pdf
                  </code>{" "}
                  ({cov.total} catalogued codes). Of the {cov.core} core learner
                  signs (R/W/IN), we cover{" "}
                  <span className="font-medium text-foreground">{cov.covered}</span>
                  {cov.missing.length > 0 && (
                    <>
                      {" "}— missing {cov.missing.length}:{" "}
                      <span className="text-foreground">
                        {cov.missing.map((m) => m.code).join(", ")}
                      </span>
                    </>
                  )}
                  . A chart code counts as covered when we hold it or any
                  parametric variant (e.g. chart <code className="text-xs">R201</code>{" "}
                  ↔ served <code className="text-xs">R201-60</code>). Temporary
                  signs (TR/TW) and road markings (GM/RM/WM) are out of MVP scope.
                </p>
              </div>
            </div>
            <a
              href="/RTSigns_charts.pdf"
              download
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Download className="size-4" /> Download chart (PDF)
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
