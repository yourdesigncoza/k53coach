import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  VEHICLE_CONTROLS,
  CONTROL_CATEGORY_META,
  COCKPIT_CALLOUTS,
} from "@/content/vehicle-controls";
import type { ControlCategory } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "meta",
  });
  return { title: t("controls") };
}

const ORDER = Object.keys(CONTROL_CATEGORY_META) as ControlCategory[];

export default function ControlsPage() {
  const t = useTranslations("module");
  const byCategory = ORDER.map((cat) => ({
    cat,
    controls: VEHICLE_CONTROLS.filter((c) => c.category === cat),
  })).filter((g) => g.controls.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {t("controlsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("controlsSubtitle")}
          </p>
        </div>
        <Button
          className="h-11 rounded-xl"
          render={
            <Link href="/learn/controls/practice">
              <Sparkles className="size-4" /> {t("practice")}
            </Link>
          }
        />
      </div>

      {/*
        The cockpit diagram (P7 in docs/exam-format-analysis/question-patterns.md).
        The legend is a numbered LIST rather than hotspots on the image: it stays
        readable on a phone, it is reachable by keyboard and screen reader, and it
        needs no pixel coordinates guessed off a raster. Mapping in
        COCKPIT_CALLOUTS — confirmed against the original artwork, not inferred.
      */}
      <figure className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <Image
          src="/img/cockpit-controls.jpg"
          alt="Numbered diagram of a right-hand-drive car cockpit showing the mirrors, windscreen wiper, steering wheel, gear lever, pedals and steering-column stalks"
          width={781}
          height={561}
          className="h-auto w-full max-w-2xl mx-auto"
          priority
        />
        <figcaption className="border-t border-border px-4 py-3 md:px-6">
          <p className="text-xs text-muted-foreground">
            The controls you are tested on, in the position you will meet them.
            Tap a number to learn what it does.
          </p>
          <ol className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {COCKPIT_CALLOUTS.map(({ n, code, label }) => (
              <li key={n}>
                <Link
                  href={`/learn/controls/${code}`}
                  className="flex items-center gap-2.5 rounded-lg py-1.5 text-sm hover:text-foreground"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs font-semibold">
                    {n}
                  </span>
                  <span className="flex-1">{label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </figcaption>
      </figure>

      {byCategory.map(({ cat, controls }) => {
        const { label, icon: Icon } = CONTROL_CATEGORY_META[cat];
        return (
          <section key={cat} className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {controls.map((c) => (
                <Card key={c.code} className="py-0">
                  <CardContent className="py-0">
                    <Link
                      href={`/learn/controls/${c.code}`}
                      className="flex items-center gap-3 py-2.5 md:py-3.5"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.summary}
                        </span>
                      </span>
                      {c.reviewStatus !== "approved" && (
                        <Badge variant="outline" className="text-[10px]">
                          {t("draft")}
                        </Badge>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
