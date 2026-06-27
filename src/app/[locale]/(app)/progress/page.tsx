import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReadinessRing } from "@/components/readiness-ring";
import { bandFor } from "@/lib/readiness";
import { getUser, getTopicAccuracy } from "@/lib/supabase/queries";
import type { Topic } from "@/lib/types";

export const metadata = { title: "Progress" };

const TOPICS: Topic[] = ["signs", "rules", "controls"];

/** Sample data for the anonymous preview; real data comes from attempts (DB7). */
const SAMPLE: Record<Topic, number> = { signs: 78, rules: 48, controls: 60 };

export default async function ProgressPage() {
  const t = await getTranslations("progressPage");
  const tb = await getTranslations("bands");
  const tt = await getTranslations("topics");
  const tr = await getTranslations("result");

  const user = await getUser();
  const acc = user ? await getTopicAccuracy(user.id) : null;

  const rows = TOPICS.map((topic) => ({
    topic,
    percent: acc
      ? acc[topic].total
        ? Math.round((acc[topic].correct / acc[topic].total) * 100)
        : 0
      : SAMPLE[topic],
  }));

  const overall = Math.round(
    rows.reduce((s, r) => s + r.percent, 0) / rows.length,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">{t("title")}</h1>

      <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-10">
        <div className="flex flex-col items-center md:col-span-1 md:items-start">
          <ReadinessRing
            percent={overall}
            label={tb(bandFor(overall))}
            sublabel={tr("overall")}
          />
        </div>

        <div className="md:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("byTopic")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {rows.map((item) => (
              <Card key={item.topic}>
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{tt(item.topic)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.percent}%
                    </span>
                  </div>
                  <Progress value={item.percent} className="h-2.5" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{t("note")}</p>
        </div>
      </div>
    </main>
  );
}
