import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROAD_RULES, RULE_CATEGORY_META, getRule } from "@/content/road-rules";

export function generateStaticParams() {
  return ROAD_RULES.map((r) => ({ code: r.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const rule = getRule(code);
  return { title: rule ? rule.title : "Road rule" };
}

const FIELDS = [
  { key: "whatToDo", icon: CarFront, labelKey: "whatYouMustDo" },
  { key: "commonMistake", icon: AlertTriangle, labelKey: "commonMistake" },
  { key: "testHint", icon: Lightbulb, labelKey: "testHint" },
] as const;

export default async function RuleDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const rule = getRule(code);
  if (!rule) notFound();

  const t = await getTranslations("module");
  const { label, icon: Icon } = RULE_CATEGORY_META[rule.category];
  const related = rule.relatedRules
    .map((c) => getRule(c))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-4 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-2 rounded-lg"
        render={
          <Link href="/learn/rules">
            <ArrowLeft className="size-4" /> {t("backRules")}
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
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">{rule.title}</h1>
            <Badge variant="secondary" className="mt-2">
              {label}
            </Badge>
          </div>

          <Card className="mt-5">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-muted-foreground">
                {t("inShort")}
              </p>
              <p className="mt-1">{rule.summary}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">{t("theRule")} </span>
                {rule.rule}
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
                    <p className="text-sm text-muted-foreground">{rule[key]}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {related.length > 0 && (
            <section className="mt-6">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <ListChecks className="size-4" /> {t("relatedRules")}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {related.map((r) => {
                  const RIcon = RULE_CATEGORY_META[r.category].icon;
                  return (
                    <Card key={r.code}>
                      <CardContent className="py-0">
                        <Link
                          href={`/learn/rules/${r.code}`}
                          className="flex items-center gap-2 py-3"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
                            <RIcon className="size-4" />
                          </span>
                          <span className="text-sm font-medium">{r.title}</span>
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
