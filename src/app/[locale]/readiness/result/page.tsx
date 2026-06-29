"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";
import { Link } from "@/i18n/navigation";
import { Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ReadinessRing, BAND_BADGE_CLASS } from "@/components/readiness-ring";
import { cn } from "@/lib/utils";
import { READINESS_RESULT_KEY } from "@/lib/storage";
import type { ReadinessBand, ReadinessResult } from "@/lib/types";

const BAND_MSG_KEY: Record<ReadinessBand, string> = {
  "not-ready": "msgNotReady",
  "almost-ready": "msgAlmostReady",
  "test-ready": "msgTestReady",
};

export default function ResultPage() {
  const t = useTranslations("result");
  const tb = useTranslations("bands");
  const tt = useTranslations("topics");
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const persisted = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(READINESS_RESULT_KEY);
    if (raw) setResult(JSON.parse(raw) as ReadinessResult);
    setLoaded(true);
  }, []);

  // Persist the snapshot once, only for signed-in learners (RLS scoped).
  useEffect(() => {
    if (!result || persisted.current) return;
    const supabase = createClient();
    if (!supabase) return;
    persisted.current = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      void supabase.from("readiness_results").insert({
        user_id: data.user.id,
        overall: result.overall,
        band: result.band,
        by_topic: result.byTopic as unknown as Json,
      });
    });
  }, [result]);

  if (loaded && !result) {
    return (
      <>
        <GlobalHeader />
        <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-5 text-center">
          <div>
            <p className="text-muted-foreground">{t("noResult")}</p>
            <Button
              className="mt-4 rounded-xl"
              render={<Link href="/readiness">{t("takeTest")}</Link>}
            />
          </div>
        </main>
      </>
    );
  }

  if (!result) return null;

  async function share() {
    const text = t("shareText", {
      percent: result!.overall,
      band: tb(result!.band),
    });
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "K53 AI Coach", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success(t("shareCopied"));
      }
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <>
      <GlobalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-28 pt-5 md:pb-12">
        <section className="flex flex-col items-center text-center">
        <ReadinessRing percent={result.overall} sublabel={t("overall")} />
        <Badge
          variant="secondary"
          className={cn(
            "mt-4 h-7 px-3 text-sm font-medium",
            BAND_BADGE_CLASS[result.band],
          )}
        >
          {tb(result.band)}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          {t(BAND_MSG_KEY[result.band])}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("byTopic")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {result.byTopic.map((topic) => (
            <Card key={topic.topic}>
              <CardContent className="py-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{tt(topic.topic)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {topic.correct}/{topic.total} · {topic.percent}%
                  </span>
                </div>
                <Progress value={topic.percent} className="h-2.5" />
                {result.weakest === topic.topic && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    {t("weakest")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Card className="ring-2 ring-foreground">
          <CardContent className="py-5 text-center">
            <p className="font-semibold">{t("ctaTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("ctaBody")}</p>
            <Button
              className="mt-4 h-12 w-full rounded-xl text-base"
              render={
                <Link href="/paywall">
                  {t("unlock")} <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              variant="ghost"
              className="mt-2 w-full rounded-xl"
              render={<Link href="/dashboard">{t("preview")}</Link>}
            />
          </CardContent>
        </Card>
      </section>

      <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl px-5 py-3 md:px-0">
          <Button
            variant="secondary"
            onClick={share}
            className="h-12 w-full rounded-xl text-base"
          >
            <Share2 className="size-4" /> {t("share")}
          </Button>
        </div>
      </div>
      </main>
    </>
  );
}
