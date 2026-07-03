"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, CheckCircle2, TriangleAlert, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReadinessRing, BAND_BADGE_CLASS } from "@/components/readiness-ring";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { TOPIC_LABEL, BAND_LABEL } from "@/lib/readiness";
import type { ReadinessBand, TopicScore } from "@/lib/types";

/**
 * DEMO / enticement only — a self-contained sample of the AI Coach assessment,
 * NOT the real post-exam feature (which lives behind the paid unlock and reads
 * a learner's real attempts). Content here is illustrative, hardcoded English
 * (learner content isn't translated yet). Three sample learners across the
 * three bands demonstrate that the coach adapts to any outcome.
 */

type Scenario = {
  id: string;
  tab: string;
  overall: number;
  band: ReadinessBand;
  byTopic: TopicScore[];
  verdict: string;
  strengths: string;
  focus: { title: string; note: string }[];
  plan: string[];
  oneThing: string;
  cta: { label: string; href: string };
};

const SCENARIOS: Scenario[] = [
  {
    id: "not-ready",
    tab: "Not ready",
    overall: 40,
    band: "not-ready",
    byTopic: [
      { topic: "signs", correct: 1, total: 6, percent: 17 },
      { topic: "rules", correct: 3, total: 5, percent: 60 },
      { topic: "controls", correct: 2, total: 4, percent: 50 },
    ],
    verdict:
      "You're not there yet — but you're closer than the number feels. 40% means you'd not pass today, and that's exactly what this test is for: it found your gaps before a booking fee did.",
    strengths:
      "Your Rules of the Road are already solid (60%) — you handled right-of-way well. Keep that.",
    focus: [
      {
        title: "Yield vs. Stop",
        note: "You read a Yield sign (downward red triangle) as a full Stop. Yield = slow down and give way; Stop = come to a complete stop every time.",
      },
      {
        title: "No-overtaking sign",
        note: "You picked “no entry” for the no-overtaking sign — two different meanings.",
      },
      {
        title: "Blue means “must”",
        note: "A blue round sign tells you what you must do. It's an instruction, not a warning.",
      },
    ],
    plan: [
      "Learn → Road Signs (~15 min) — start with shapes & colours.",
      "Practice → Road Signs until you hit 8/10 twice in a row.",
      "Re-take this readiness test — you should jump a full band.",
    ],
    oneThing:
      "Learn what each shape and colour means before the specific signs. It unlocks half the questions.",
    cta: { label: "Practice Road Signs", href: "/readiness" },
  },
  {
    id: "almost-ready",
    tab: "Almost ready",
    overall: 60,
    band: "almost-ready",
    byTopic: [
      { topic: "signs", correct: 4, total: 6, percent: 67 },
      { topic: "rules", correct: 2, total: 5, percent: 40 },
      { topic: "controls", correct: 3, total: 4, percent: 75 },
    ],
    verdict:
      "So close — one topic is standing between you and test-ready. 60% puts you in striking distance; fix one area and you're over the line.",
    strengths:
      "Vehicle Controls (75%) and Road Signs (67%) are in good shape — you clearly know your way around the car.",
    focus: [
      {
        title: "Following distance",
        note: "Remember the two-second rule: pick a fixed point ahead; you should pass it no sooner than two seconds after the car in front.",
      },
      {
        title: "Four-way stop",
        note: "First to stop is first to go. If you stop at the same time, the vehicle on the right goes first.",
      },
      {
        title: "Pedestrian crossings",
        note: "A pedestrian already on the crossing has right of way — wait for them to clear.",
      },
    ],
    plan: [
      "Learn → Rules of the Road (~20 min), focus on right-of-way & following distance.",
      "Practice → Rules of the Road to 8/10.",
      "A quick Road Signs top-up to turn your 67% into full marks.",
    ],
    oneThing:
      "Right-of-way rules. They repeat across the test in different wording — nail them once and you catch several questions.",
    cta: { label: "Practice Rules of the Road", href: "/readiness" },
  },
  {
    id: "test-ready",
    tab: "Test ready",
    overall: 87,
    band: "test-ready",
    byTopic: [
      { topic: "signs", correct: 6, total: 6, percent: 100 },
      { topic: "rules", correct: 4, total: 5, percent: 80 },
      { topic: "controls", correct: 3, total: 4, percent: 75 },
    ],
    verdict:
      "You're test-ready — go book it. 87% is a comfortable pass. This is the “tidy up the last corner” read, not a warning.",
    strengths:
      "Road Signs 100%, Rules 80%. That's the hard part of the learner's test, already done.",
    focus: [
      {
        title: "Hill start",
        note: "Your one Vehicle Controls slip: handbrake stays on until the clutch bites and the car wants to pull, then release — that's what stops the roll-back that fails people on the day.",
      },
    ],
    plan: [
      "One Practice → Vehicle Controls round to lock the hill start.",
      "A full 15-question dry run the night before.",
    ],
    oneThing:
      "Don't over-study. You know this — a light review beats cramming.",
    cta: { label: "See your booking checklist", href: "/readiness" },
  },
];

export function AssessmentDemo() {
  const [active, setActive] = useState(0);
  const s = SCENARIOS[active];
  const weakest = s.byTopic.reduce((m, t) => (t.percent < m.percent ? t : m));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 md:pt-8">
      {/* Framing — honest: this is a sample */}
      <div className="text-center">
        <Badge variant="secondary" className="h-7 px-3 text-xs font-medium">
          Sample · demonstration
        </Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          What your AI Coach tells you
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          After the test, the AI Coach turns your score into a plain-language plan
          — not just a number. Here&apos;s the same coach reading three different
          results.
        </p>
      </div>

      {/* Scenario switcher */}
      <div
        role="tablist"
        aria-label="Sample result"
        className="mx-auto mt-6 flex w-full max-w-md gap-1.5 rounded-2xl bg-surface-2 p-1.5"
      >
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              i === active
                ? "bg-surface text-surface-ink shadow-[var(--shadow-sm)] ring-1 ring-[var(--surface-border)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {sc.tab}
          </button>
        ))}
      </div>

      {/* Snapshot: ring + band + topic bars */}
      <section className="mt-6 flex flex-col items-center text-center">
        <ReadinessRing percent={s.overall} sublabel="readiness" />
        <Badge
          variant="secondary"
          className={cn(
            "mt-4 h-7 px-3 text-sm font-medium",
            BAND_BADGE_CLASS[s.band],
          )}
        >
          {BAND_LABEL[s.band]}
        </Badge>
      </section>

      <div className="mt-6 flex flex-col gap-3">
        {s.byTopic.map((topic) => (
          <Card key={topic.topic}>
            <CardContent className="py-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{TOPIC_LABEL[topic.topic]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {topic.correct}/{topic.total} · {topic.percent}%
                </span>
              </div>
              <Progress value={topic.percent} className="h-2.5" />
              {weakest.topic === topic.topic && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  Weakest area
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The assessment itself */}
      <div className="mt-6 flex flex-col gap-4">
        {/* Verdict */}
        <Card className="bg-surface-2 ring-border">
          <CardContent className="py-5">
            <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-copper-500">
              <Icon name="i-spark" size="sm" /> Coach Says
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed">{s.verdict}</p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardContent className="py-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-success" /> What you&apos;ve
              already got
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.strengths}</p>
          </CardContent>
        </Card>

        {/* Focus / where marks go */}
        <Card>
          <CardContent className="py-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert className="size-4 text-destructive" /> Where
              you&apos;re losing marks
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {s.focus.map((f) => (
                <li key={f.title} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                  <span className="text-sm">
                    <span className="font-medium">{f.title}</span> —{" "}
                    <span className="text-muted-foreground">{f.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardContent className="py-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-foreground" /> Your plan
            </p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {s.plan.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* The one thing */}
        <Card className="ring-2 ring-foreground">
          <CardContent className="py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              If you do one thing
            </p>
            <p className="mt-1.5 text-[0.95rem] font-medium">{s.oneThing}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enticement CTA */}
      <div className="mt-8 flex flex-col gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Your real assessment is built from your own answers.
        </p>
        <Button
          className="h-12 w-full rounded-xl text-base"
          render={
            <Link href="/readiness">
              Take the free test <ArrowRight className="size-4" />
            </Link>
          }
        />
        <Button
          variant="ghost"
          className="w-full rounded-xl"
          render={<Link href="/paywall">Unlock full access</Link>}
        />
      </div>
    </main>
  );
}
