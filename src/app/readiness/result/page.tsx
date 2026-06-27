"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ReadinessRing, BAND_BADGE_CLASS } from "@/components/readiness-ring";
import { cn } from "@/lib/utils";
import { BAND_LABEL, TOPIC_LABEL } from "@/lib/readiness";
import { READINESS_RESULT_KEY } from "@/lib/storage";
import type { ReadinessResult } from "@/lib/types";

const BAND_MESSAGE: Record<string, string> = {
  "not-ready":
    "There's work to do — but now you know exactly where. Your AI coach can close these gaps fast.",
  "almost-ready":
    "You're close! A focused push on your weak areas should get you test-ready.",
  "test-ready":
    "Great work — you're tracking well. Keep practising to lock it in.",
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(READINESS_RESULT_KEY);
    if (raw) setResult(JSON.parse(raw) as ReadinessResult);
    setLoaded(true);
  }, []);

  if (loaded && !result) {
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center px-5 text-center">
        <div>
          <p className="text-muted-foreground">
            No readiness result yet. Take the free test to see your score.
          </p>
          <Button
            className="mt-4 rounded-xl"
            render={<Link href="/readiness">Take the free test</Link>}
          />
        </div>
      </main>
    );
  }

  if (!result) return null;

  async function share() {
    const text = `My K53 readiness score is ${result!.overall}% (${
      BAND_LABEL[result!.band]
    }). Check yours free:`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "K53 AI Coach", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Copied — paste it to your parent on WhatsApp.");
      }
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-28 md:pb-12">
      <header className="pt-safe py-5">
        <Logo />
      </header>

      <section className="flex flex-col items-center text-center">
        <ReadinessRing percent={result.overall} sublabel="Overall readiness" />
        <Badge
          variant="secondary"
          className={cn(
            "mt-4 h-7 px-3 text-sm font-medium",
            BAND_BADGE_CLASS[result.band],
          )}
        >
          {BAND_LABEL[result.band]}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          {BAND_MESSAGE[result.band]}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          By topic
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {result.byTopic.map((t) => (
            <Card key={t.topic}>
              <CardContent className="py-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{TOPIC_LABEL[t.topic]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {t.correct}/{t.total} · {t.percent}%
                  </span>
                </div>
                <Progress value={t.percent} className="h-2.5" />
                {result.weakest === t.topic && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    Your weakest area — start here.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Card className="ring-2 ring-primary">
          <CardContent className="py-5 text-center">
            <p className="font-semibold">Ready to close the gaps?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlock 90 days of full practice + AI explanations for{" "}
              <span className="font-medium text-foreground">R179</span>.
            </p>
            <Button
              className="mt-4 h-12 w-full rounded-xl text-base"
              render={
                <Link href="/paywall">
                  Unlock full access <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              variant="ghost"
              className="mt-2 w-full rounded-xl"
              render={<Link href="/dashboard">Preview the app first</Link>}
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
            <Share2 className="size-4" /> Share my score with a parent
          </Button>
        </div>
      </div>
    </main>
  );
}
