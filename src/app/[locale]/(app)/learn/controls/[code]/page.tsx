import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Hand,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  VEHICLE_CONTROLS,
  CONTROL_CATEGORY_META,
  getControl,
} from "@/content/vehicle-controls";

export function generateStaticParams() {
  return VEHICLE_CONTROLS.map((c) => ({ code: c.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const control = getControl(code);
  return { title: control ? control.name : "Vehicle control" };
}

const FIELDS = [
  { key: "howToUse", icon: Hand, labelKey: "howToUse" },
  { key: "commonMistake", icon: AlertTriangle, labelKey: "commonMistake" },
  { key: "testHint", icon: Lightbulb, labelKey: "testHint" },
] as const;

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const control = getControl(code);
  if (!control) notFound();

  const t = await getTranslations("module");
  const { label, icon: Icon } = CONTROL_CATEGORY_META[control.category];
  const related = control.relatedControls
    .map((c) => getControl(c))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-4 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-2 rounded-lg"
        render={
          <Link href="/learn/controls">
            <ArrowLeft className="size-4" /> {t("backControls")}
          </Link>
        }
      />

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-10">
        {/* Left: identity */}
        <div className="md:sticky md:top-8">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <span className="grid size-20 place-items-center rounded-2xl bg-secondary text-foreground md:size-24">
              <Icon className="size-9 md:size-11" />
            </span>
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">
              {control.name}
            </h1>
            <Badge variant="secondary" className="mt-2">
              {label}
            </Badge>
          </div>

          <Card className="mt-5">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-muted-foreground">
                {t("inShort")}
              </p>
              <p className="mt-1">{control.summary}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">{t("whatItDoes")} </span>
                {control.whatItDoes}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: coaching detail */}
        <div className="mt-3 md:mt-0">
          <div className="grid gap-3">
            {FIELDS.map(({ key, icon: FieldIcon, labelKey }) => (
              <Card key={key}>
                <CardContent className="flex items-start gap-3 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                    <FieldIcon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t(labelKey)}</p>
                    <p className="text-sm text-muted-foreground">
                      {control[key]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {related.length > 0 && (
            <section className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <ListChecks className="size-4" /> {t("relatedControls")}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {related.map((r) => {
                  const RIcon = CONTROL_CATEGORY_META[r.category].icon;
                  return (
                    <Card key={r.code}>
                      <CardContent className="py-0">
                        <Link
                          href={`/learn/controls/${r.code}`}
                          className="flex items-center gap-2 py-3"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
                            <RIcon className="size-4" />
                          </span>
                          <span className="text-sm font-medium">{r.name}</span>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
