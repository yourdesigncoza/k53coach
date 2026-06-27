import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROAD_RULES, RULE_CATEGORY_META } from "@/content/road-rules";
import type { RuleCategory } from "@/lib/types";

export const metadata = { title: "Rules of the Road" };

const ORDER = Object.keys(RULE_CATEGORY_META) as RuleCategory[];

export default function RulesPage() {
  const t = useTranslations("module");
  const byCategory = ORDER.map((cat) => ({
    cat,
    rules: ROAD_RULES.filter((r) => r.category === cat),
  })).filter((g) => g.rules.length > 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            {t("rulesTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("rulesSubtitle")}</p>
        </div>
        <Button
          className="h-11 rounded-xl"
          render={
            <Link href="/learn/rules/practice">
              <Sparkles className="size-4" /> {t("practice")}
            </Link>
          }
        />
      </div>

      {byCategory.map(({ cat, rules }) => {
        const { label, icon: Icon } = RULE_CATEGORY_META[cat];
        return (
          <section key={cat} className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {rules.map((r) => (
                <Card key={r.code}>
                  <CardContent className="py-0">
                    <Link
                      href={`/learn/rules/${r.code}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{r.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.summary}
                        </span>
                      </span>
                      {r.reviewStatus !== "approved" && (
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
