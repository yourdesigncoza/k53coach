import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReadinessRing } from "@/components/readiness-ring";
import { TOPIC_LABEL, BAND_LABEL, bandFor } from "@/lib/readiness";
import type { Topic } from "@/lib/types";

export const metadata = { title: "Progress" };

/**
 * Progress / readiness breakdown. Sample data in the scaffold; reads the
 * learner's real DB7/DB9 history once auth + persistence are wired.
 */
const SAMPLE: { topic: Topic; percent: number }[] = [
  { topic: "signs", percent: 78 },
  { topic: "rules", percent: 48 },
  { topic: "controls", percent: 60 },
];

export default function ProgressPage() {
  const overall = Math.round(
    SAMPLE.reduce((s, t) => s + t.percent, 0) / SAMPLE.length,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Your progress</h1>

      <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-10">
        <div className="flex flex-col items-center md:col-span-1 md:items-start">
          <ReadinessRing
            percent={overall}
            label={BAND_LABEL[bandFor(overall)]}
            sublabel="Overall readiness"
          />
        </div>

        <div className="md:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            By topic
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {SAMPLE.map((t) => (
              <Card key={t.topic}>
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{TOPIC_LABEL[t.topic]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {t.percent}%
                    </span>
                  </div>
                  <Progress value={t.percent} className="h-2.5" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Readiness blends mock average, topic accuracy, weak-area improvement
            and consistency (DB9). Shown here with sample data.
          </p>
        </div>
      </div>
    </main>
  );
}
