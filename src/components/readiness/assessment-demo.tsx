"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  CheckCircle2,
  TriangleAlert,
  TrendingUp,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import {
  ReadinessRing,
  BAND_BADGE_CLASS,
  BAND_FILL,
} from "@/components/readiness-ring";
import { CoachCard } from "@/components/quiz/quiz-chrome";
import { CtaBand } from "@/components/readiness/cta-band";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";
import { TOPIC_LABEL, BAND_LABEL } from "@/lib/readiness";
import type { ReadinessBand, TopicScore } from "@/lib/types";

/**
 * DEMO / enticement only — a self-contained sample of the AI Coach assessment,
 * NOT the real post-exam feature (which lives behind the paid unlock and reads
 * a learner's real attempts). Content here is illustrative, hardcoded English
 * (learner content isn't translated yet).
 *
 * This is a PUBLIC MARKETING page: it uses the DARK storefront theme
 * (`theme-dark`) like the landing, and floats the coach report as a WHITE
 * app-preview panel on the dark canvas — the same "dark shell wrapping a white
 * working surface" pattern the landing quiz demo uses. Because it's inside
 * `theme-dark`, every surface inside the white panel must use the FIXED
 * `--surface-*` tokens (not semantic `text-foreground`), or it flips to ivory
 * and disappears. The signs are the real PD SADC artwork the app serves.
 */

/** White app-preview panel + inner cards use the fixed white-surface palette. */
const CARD = "rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-4";
const INK = "text-[var(--surface-ink)]";
const INK2 = "text-[var(--surface-ink-2)]";

/** A section-pass counts as ~80% of that section's questions. */
const PASS_RATIO = 0.8;
const targetFor = (total: number) => Math.round(total * PASS_RATIO);

type SignRef = { code: string; name: string };

type Focus = {
  title: string;
  cat: string;
  note: string;
  signs?: { correct: SignRef; picked: SignRef };
};

type NextLesson = {
  title: string;
  minutes: number;
  action: string;
  why: string;
  goal: string;
  cta: { label: string; href: string };
};

type Scenario = {
  id: string;
  tab: string;
  overall: number;
  band: ReadinessBand;
  byTopic: TopicScore[];
  verdict: string;
  strengths: string;
  focus: Focus[];
  next: NextLesson;
  path: { steps: string[]; expected: string };
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
      "You're not test-ready yet, and it's almost all one thing: Road Signs, at 1 out of 6. The good news is your Rules of the Road answers (3 of 5) show you already understand some of the driving logic. Get the sign basics down first and your score should climb quickly.",
    strengths:
      "Your Rules of the Road are already solid at 60%; you handled right-of-way well. Keep that up.",
    focus: [
      {
        title: "You read a Yield as a Stop",
        cat: "Regulatory signs",
        note: "Yield means slow down and give way. Stop means come to a complete stop, every time — even on an empty road.",
        signs: {
          correct: { code: "R2", name: "Yield" },
          picked: { code: "R1", name: "Stop" },
        },
      },
      {
        title: "Overtaking-prohibited vs no-entry",
        cat: "Prohibition signs",
        note: "Overtaking prohibited means don't pass the car ahead. No entry means don't drive in at all. Different rule, different sign.",
        signs: {
          correct: { code: "R214", name: "Overtaking prohibited" },
          picked: { code: "R3", name: "No entry" },
        },
      },
      {
        title: "Blue circle means “must”",
        cat: "Shapes & colours",
        note: "A blue round sign is an instruction — something you have to do. It's not a warning.",
      },
    ],
    next: {
      title: "Road Signs: Shapes & Colours",
      minutes: 12,
      action: "Learn what each shape and colour means before the specific signs.",
      why: "You're reading signs one at a time. The shape and colour already tell you most of the answer: a red triangle warns, a red circle prohibits, a blue circle instructs.",
      goal: "Score 8/10 on Road Signs twice in a row before your next full test.",
      cta: { label: "Start Road Signs lesson", href: "/readiness/lesson-demo" },
    },
    path: {
      steps: [
        "1 short lesson — sign shapes & colours (12 min)",
        "2 practice rounds on Road Signs",
        "1 mixed readiness test",
      ],
      expected: "55–65%",
    },
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
      "You're almost there. One topic is holding you back: Rules of the Road, at 2 out of 5. Everything else is already in the pass zone. Clear the right-of-way rules and you're over the line.",
    strengths:
      "Vehicle Controls (75%) and Road Signs (67%) are in good shape. You clearly know your way around a car.",
    focus: [
      {
        title: "Following distance",
        cat: "Right of way",
        note: "Use the two-second rule: pick a fixed point ahead; you should pass it no sooner than two seconds after the car in front.",
      },
      {
        title: "Four-way stop",
        cat: "Intersections",
        note: "First to stop is first to go. If you stop at the same time, the vehicle on the right goes first.",
      },
      {
        title: "Pedestrian crossings",
        cat: "Right of way",
        note: "A pedestrian already on the crossing has right of way — wait for them to clear.",
      },
    ],
    next: {
      title: "Rules of the Road: Right of Way",
      minutes: 18,
      action: "Learn the right-of-way order for stops, circles and crossings.",
      why: "These rules come back across the test in different wording. Learn them once and you catch several questions at a time.",
      goal: "Score 8/10 on Rules of the Road.",
      cta: { label: "Start Rules lesson", href: "/readiness/lesson-demo" },
    },
    path: {
      steps: [
        "1 lesson — right of way (18 min)",
        "2 practice rounds on Rules",
        "1 quick Road Signs top-up",
        "1 mixed readiness test",
      ],
      expected: "72–80%",
    },
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
      "87% is a comfortable pass, and Road Signs, the part that trips most people, came back perfect. One small Vehicle Controls gap is all that's left. Put a few more mock papers behind you at this level before you book the real test.",
    strengths:
      "Road Signs 100%, Rules 80%. That's the hard part of the learner's test, already behind you.",
    focus: [
      {
        title: "Hill start",
        cat: "Braking & clutch",
        note: "Your one slip: handbrake stays on until the clutch bites and the car wants to pull, then release. That's what stops the roll-back that fails people on the day.",
      },
    ],
    next: {
      title: "Vehicle Controls: Hill Starts",
      minutes: 8,
      action: "Run one Vehicle Controls round focused on the hill start.",
      why: "It's your only slip, and it's a common one on the day. A few clean reps and it's muscle memory.",
      goal: "One clean practice round, then a full 15-question dry run the night before.",
      cta: { label: "Start Vehicle Controls round", href: "/readiness/lesson-demo" },
    },
    path: {
      steps: [
        "1 Vehicle Controls round — hill start (8 min)",
        "1 full 15-question dry run the night before",
        "Book your test",
      ],
      expected: "85–90% (hold steady)",
    },
  },
];

/** Small tinted icon chip — echoes the landing's gold-chip section headers. */
function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "gold" | "success" | "destructive";
}) {
  const tint =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-copper-500/10 text-copper-500";
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-[9px]",
        tint,
      )}
    >
      {children}
    </span>
  );
}

/** A confused-signs pair with real SADC artwork — both full colour. */
function SignPair({ correct, picked }: NonNullable<Focus["signs"]>) {
  const cell = (ref: SignRef, right: boolean) => (
    <figure className="flex flex-1 flex-col items-center gap-1.5">
      <div className="grid size-20 place-items-center rounded-xl bg-white p-2.5 shadow-sm md:size-16">
        <SignImage
          svgFile={`signs/${ref.code}.svg`}
          name={ref.name}
          className="size-full"
        />
      </div>
      <figcaption className="text-center text-xs leading-tight">
        <span
          className={cn(
            "flex items-center justify-center gap-1 font-semibold",
            right ? "text-success" : "text-destructive",
          )}
        >
          {right && <CheckCircle2 className="size-3" />}
          {right ? "Correct" : "You chose"}
        </span>
        <span className={INK2}>{ref.name}</span>
      </figcaption>
    </figure>
  );
  return (
    <div className="mt-1 flex items-center gap-2">
      {cell(picked, false)}
      <ArrowRight className={cn("size-4 shrink-0", INK2)} />
      {cell(correct, true)}
    </div>
  );
}

export function AssessmentDemo() {
  const t = useTranslations("assessmentDemo");
  const [active, setActive] = useState(0);
  const s = SCENARIOS[active];
  // `topic`, not `t` — `t` is the translator above and shadowing it here reads
  // as a translation call to anyone skimming the reduce.
  const weakest = s.byTopic.reduce((m, topic) =>
    topic.percent < m.percent ? topic : m,
  );

  return (
    <div className="theme-dark min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-14 md:pt-20">
        {/* ---- Hero intro — landing-style dark header ---- */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-gold-300">
            <Icon name="i-spark" size="sm" /> {t("eyebrow")}
          </span>
          <h1 className="mx-auto mt-5 max-w-xl font-display text-[clamp(1.9rem,1.4rem+2vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
            {t("titleLead")} <span className="text-gold-400">{t("titleAccent")}</span> {t("titleSuffix")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-mist">
            {t("heroBody")}
          </p>
        </div>

        {/* ---- Scenario switcher (dark pills) ---- */}
        <div
          role="tablist"
          aria-label={t("sampleAria")}
          className="mx-auto mt-7 flex w-full max-w-md gap-2"
        >
          {SCENARIOS.map((sc, i) => (
            <button
              key={sc.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 font-display text-sm font-semibold transition-colors",
                i === active
                  ? "border-gold-400 bg-gold-400 text-[#2A1C0B] shadow-[var(--glow-gold)]"
                  : "border-ink-700 bg-ink-800 text-mist hover:border-gold-400 hover:text-ivory",
              )}
            >
              {sc.tab}
            </button>
          ))}
        </div>

        {/* ---- The report: white app-preview panel floating on dark ---- */}
        <div className="mt-7 rounded-[24px] border border-ink-700 bg-surface p-4 shadow-[0_24px_60px_rgba(0,0,0,.45)] md:p-6">
          {/* Snapshot: ring + band */}
          <section className="flex flex-col items-center text-center">
            <ReadinessRing
              percent={s.overall}
              band={s.band}
              sublabel="readiness"
            />
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

          {/* Per-topic: result vs the pass target */}
          <div className="mt-6 flex flex-col gap-3">
            {s.byTopic.map((topic) => {
              const target = targetFor(topic.total);
              const gap = Math.max(0, target - topic.correct);
              return (
                <div key={topic.topic} className={CARD}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className={cn("font-semibold", INK)}>
                      {TOPIC_LABEL[topic.topic]}
                    </span>
                    <span className={cn("tabular-nums", INK2)}>
                      {topic.correct}/{topic.total} · {topic.percent}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${topic.percent}%`,
                        background: BAND_FILL[s.band],
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs">
                    {gap > 0 ? (
                      <span className="font-medium text-destructive">
                        Target {target}/{topic.total} · {gap} more to reach pass
                        level
                      </span>
                    ) : (
                      <span className="font-medium text-success">
                        Pass level reached ({target}/{topic.total})
                      </span>
                    )}
                    {weakest.topic === topic.topic && (
                      <span className={INK2}> · your weakest area</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Verdict — shared CoachCard */}
          <div className="mt-6">
            <CoachCard>{s.verdict}</CoachCard>
          </div>

          {/* Strengths */}
          <div className={cn(CARD, "mt-4")}>
            <p className={cn("flex items-center gap-2 text-sm font-semibold", INK)}>
              <Chip tone="success">
                <CheckCircle2 className="size-4" />
              </Chip>
              {t("strengths")}
            </p>
            <p className={cn("mt-2 text-sm", INK2)}>{s.strengths}</p>
          </div>

          {/* Focus / where marks go */}
          <div className={cn(CARD, "mt-4")}>
            <p className={cn("flex items-center gap-2 text-sm font-semibold", INK)}>
              <Chip tone="destructive">
                <TriangleAlert className="size-4" />
              </Chip>
              {t("losing")}
            </p>
            <ul className="mt-4 flex flex-col">
              {s.focus.map((f) => (
                <li
                  key={f.title}
                  className="flex flex-col gap-2 border-t border-[var(--surface-border)] pt-5 first:border-t-0 first:pt-0 [&:not(:first-child)]:mt-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-base font-semibold", INK)}>
                      {f.title}
                    </span>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-[var(--surface-ink-2)]">
                      {f.cat}
                    </span>
                  </div>
                  {f.signs && <SignPair {...f.signs} />}
                  <p
                    className={cn(
                      "mt-0.5 border-l-4 border-gold-400 pl-3 text-sm leading-relaxed",
                      INK2,
                    )}
                  >
                    {f.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Your next N minutes — the hero next-action (gold-tinted) */}
          <div className="mt-4 rounded-[14px] border border-gold-400/45 bg-gold-400/[0.07] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-copper-500">
              Your next {s.next.minutes} minutes
            </p>
            <p className={cn("mt-2 font-display text-base font-semibold", INK)}>
              {s.next.title}
            </p>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div>
                <dt className={cn("inline font-semibold", INK)}>{t("doNow")} </dt>
                <span className={INK2}>{s.next.action}</span>
              </div>
              <div>
                <dt className={cn("inline font-semibold", INK)}>{t("why")}</dt>
                <span className={INK2}>{s.next.why}</span>
              </div>
              <div>
                <dt className={cn("inline font-semibold", INK)}>{t("goal")} </dt>
                <span className={INK2}>{s.next.goal}</span>
              </div>
            </dl>
            <Button
              className="mt-4 h-11 w-full rounded-xl font-display font-semibold"
              render={
                <Link href={s.next.cta.href}>
                  {s.next.cta.label} <ArrowRight className="size-4" />
                </Link>
              }
            />
          </div>

          {/* Estimated path to test-ready */}
          <div className={cn(CARD, "mt-4")}>
            <p className={cn("flex items-center gap-2 text-sm font-semibold", INK)}>
              <Chip tone="gold">
                <TrendingUp className="size-4" />
              </Chip>
              {t("path")}
            </p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {s.path.steps.map((step, i) => (
                <li key={i} className={cn("flex gap-3 text-sm", INK)}>
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-400 text-xs font-semibold text-[#2A1C0B]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-3 px-3 py-2.5 text-sm">
              <span className={INK2}>{t("expected")}</span>
              <span className={cn("font-display font-bold tabular-nums", INK)}>
                {s.path.expected}
              </span>
            </div>
          </div>
        </div>

        {/* ---- Why the test-first model (dark) ---- */}
        <div className="mt-6 flex items-start gap-2.5 rounded-[18px] border border-ink-700 bg-ink-800 p-4">
          <Compass className="mt-0.5 size-4 shrink-0 text-gold-400" />
          <p className="text-sm text-mist">
            <span className="font-medium text-ivory">{t("whyTest")}</span>{" "}
            {t("whyTestBody")}
          </p>
        </div>

        {/* ---- Final CTA band ---- */}
        <CtaBand
          className="mt-8"
          title={t("realPlanNote")}
          subtitle={t("ctaSub")}
          action={{ label: t("ctaBtn"), href: "/paywall" }}
        />
      </main>
    </div>
  );
}
