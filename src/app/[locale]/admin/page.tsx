import { Link } from "@/i18n/navigation";
import {
  ChevronRight,
  ListChecks,
  Languages,
  FileQuestion,
  KeyRound,
  BookOpen,
  MessageSquareWarning,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExceptionsQueue,
  type QueueRow,
} from "@/components/admin/exceptions-queue";
import { getSigns } from "@/lib/supabase/queries";
import {
  isShippable,
  isInExceptionsQueue,
  signVerification,
  chartMatch,
} from "@/lib/signs";

export const metadata = { title: "Admin · Signs" };

export default async function AdminSignsPage() {
  const signs = await getSigns();
  const shippable = signs.filter(isShippable).length;
  const excluded = signs.filter((s) => s.sa_relevant === false).length;

  // Exceptions queue: in-chart signs that aren't shippable yet.
  const queue: QueueRow[] = signs.filter(isInExceptionsQueue).map((s) => {
    const v = signVerification(s);
    const cm = chartMatch(s);
    return {
      code: s.code,
      name: s.name,
      svgFile: s.svg_file,
      alignment: s.alignment,
      chartName: cm?.name ?? null,
      chartPage: cm?.page ?? null,
      confidence: v?.confidence ?? null,
      reason: v?.reason ?? null,
      suggestedName: v?.suggestedName ?? null,
      contentIssue: v?.contentIssue ?? null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Road sign review</h1>
      <p className="text-sm text-muted-foreground">
        {signs.length} signs · {shippable} shippable · {queue.length} in review
        queue · {excluded} excluded (not in chart).
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Exceptions queue ({queue.length}) — verified against the official DoT
          chart; these need a human
        </h2>
        <ExceptionsQueue rows={queue} />
      </section>

      <section className="mt-6">
        <Card>
          <CardContent className="py-0">
            <Link
              href="/admin/sign-review"
              className="flex items-center gap-3 py-3.5"
            >
              <ListChecks className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">Sign review</span>
                <span className="block text-xs text-muted-foreground">
                  Browse all {signs.length} signs by category
                  {excluded > 0 ? ` — excluded (${excluded}) listed first` : ""}.
                  Click any sign to edit.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardContent className="py-0">
            <Link
              href="/admin/feedback"
              className="flex items-center gap-3 py-3.5"
            >
              <MessageSquareWarning className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">
                  Learner reports
                </span>
                <span className="block text-xs text-muted-foreground">
                  Bugs and content flags filed from inside the app. Content flags
                  arrive anchored to the question or sign, with its provenance
                  snapshotted. Push to Linear from here.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardContent className="py-0">
            <Link
              href="/admin/questions"
              className="flex items-center gap-3 py-3.5"
            >
              <FileQuestion className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">Question bank</span>
                <span className="block text-xs text-muted-foreground">
                  Add, edit, approve, and delete quiz questions. Approved-only is
                  served; the free readiness test uses the flagged set.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardContent className="py-0">
            <Link
              href="/admin/entitlements"
              className="flex items-center gap-3 py-3.5"
            >
              <KeyRound className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">Entitlements</span>
                <span className="block text-xs text-muted-foreground">
                  Grant paid access by email (90 days). Gates the mock exam and
                  other paid areas.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card>
          <CardContent className="py-0">
            <Link
              href="/admin/translations"
              className="flex items-center gap-3 py-3.5"
            >
              <Languages className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">UI translations</span>
                <span className="block text-xs text-muted-foreground">
                  Edit the English wording and Afrikaans translation of every
                  interface string. Changes go live immediately.
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Help — set apart from the content-management cards above. */}
      <Link
        href="/admin/guide"
        className="mt-12 flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3.5 ring-1 ring-border transition-colors hover:bg-secondary"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
          <BookOpen className="size-4.5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Admin guide</span>
          <span className="block text-xs text-muted-foreground">
            How to add and update signs, questions, translations and access — a
            quick at-a-glance reference.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}
