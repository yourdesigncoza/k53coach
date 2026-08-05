"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { QuestionCard } from "@/components/quiz/question-card";
import {
  QuizHead,
  QuizScore,
  QuizProgress,
  QuizButton,
} from "@/components/quiz/quiz-chrome";
import type { Question } from "@/lib/types";
import { ENTITLEMENT_DAYS, ENTITLEMENT_PRICE_LABEL } from "@/lib/pricing";

/**
 * Interactive "try it live" quiz demo for the landing page — a faithful React
 * port of the approved prototype's Practice-mode demo. It intentionally shows
 * the design story in one frame: a DARK app shell (sidebar) wrapping a WHITE
 * working surface (the quiz). Fully honest — this is the real practice UX
 * rendered by the SAME shared quiz components as the app (QuizPanel,
 * QuestionCard, quiz-chrome), so landing and app can never drift apart.
 * Questions are verified K53 content (English; content isn't translated yet)
 * and the signs are the real PD SADC artwork the app serves.
 */

const QUESTIONS: Question[] = [
  {
    id: "demo-stop",
    topic: "signs",
    difficulty: 1,
    signCode: "R1",
    prompt: "You approach an eight-sided red sign. What must you do?",
    options: [
      "Slow down only if other cars are near",
      "Come to a complete stop, then go when it is safe",
      "Sound your hooter and continue",
      "Stop only at night",
    ],
    answer: 1,
    explanation:
      "An eight-sided red sign is a STOP sign. You must come to a complete stop every time, then go only when it is safe.",
  },
  {
    id: "demo-yield",
    topic: "signs",
    difficulty: 1,
    signCode: "R2",
    prompt: "What does a downward-pointing red-and-white triangle mean?",
    options: [
      "Stop completely and wait for a signal",
      "Yield — give way to traffic and pedestrians",
      "No entry for any vehicle",
      "Parking is allowed here",
    ],
    answer: 1,
    explanation:
      "A downward red-and-white triangle is a YIELD sign. Slow down and give way; only stop if needed to let others pass.",
  },
  {
    id: "demo-speed",
    topic: "rules",
    difficulty: 1,
    signCode: "R201-60",
    prompt: "Inside a red circle showing '60', what is being told to you?",
    options: [
      "Minimum speed is 60 km/h",
      "Suggested speed is 60 km/h",
      "Maximum speed is 60 km/h — do not exceed it",
      "Distance to the next town is 60 km",
    ],
    answer: 2,
    explanation:
      "A number inside a red circle is a maximum speed limit. Here you may not drive faster than 60 km/h.",
  },
];

const SIDE_NAV: { icon: Parameters<typeof Icon>[0]["name"]; label: string; active?: boolean }[] = [
  { icon: "i-dashboard", label: "Dashboard" },
  { icon: "i-practice", label: "Practice", active: true },
  { icon: "i-topics", label: "Topics" },
  { icon: "i-mock", label: "Mock Test" },
  { icon: "i-progress", label: "Progress" },
  { icon: "i-trophy", label: "Achievements" },
];

const CONFIDENCE: { icon: Parameters<typeof Icon>[0]["name"]; label: string }[] = [
  { icon: "i-face-sad", label: "Not confident" },
  { icon: "i-face-neutral", label: "Unsure" },
  { icon: "i-face-happy", label: "Confident" },
];

export function LandingQuizDemo() {
  const t = useTranslations("practice");
  const tl = useTranslations("landing");
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [confidence, setConfidence] = useState(2);

  const q = QUESTIONS[idx];
  const answered = chosen !== null;
  const isLast = idx === QUESTIONS.length - 1;
  const progress = ((idx + (answered ? 1 : 0)) / QUESTIONS.length) * 100;

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (isLast) {
      setIdx(0);
      setCorrect(0);
    } else {
      setIdx((i) => i + 1);
    }
    setChosen(null);
  }

  function back() {
    if (idx === 0) return;
    setIdx((i) => i - 1);
    setChosen(null);
  }

  return (
    <div className="grid overflow-hidden rounded-[24px] border border-ink-700 bg-ink-900 shadow-[var(--shadow-lg)] md:grid-cols-[232px_1fr]">
      {/* Dark app shell (sidebar) — hidden on mobile, exactly like the app */}
      <aside className="hidden flex-col gap-2 border-r border-ink-700 p-5 md:flex">
        <span className="mb-4 inline-flex items-center gap-2 font-display text-base font-bold text-ivory">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-[8px] text-[0.8rem] font-extrabold text-[#2a1c0b]"
            style={{ background: "linear-gradient(145deg, var(--gold-400), var(--copper-500))" }}
          >
            K
          </span>
          K53 Coach
        </span>
        {SIDE_NAV.map((n) => (
          <span
            key={n.label}
            className={cn(
              "flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-sm font-medium",
              n.active
                ? "bg-gold-400/12 text-gold-300"
                : "text-mist",
            )}
          >
            <Icon name={n.icon} size="sm" /> {n.label}
          </span>
        ))}
        <div
          className="mt-auto rounded-[14px] border border-ink-600 p-4"
          style={{ background: "linear-gradient(160deg, rgba(255,178,77,.14), rgba(255,196,107,.06))" }}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gold-300">
            <Icon name="i-lock" size="sm" /> {tl("planCta")}
          </div>
          <div className="mt-0.5 text-xs text-mist">
            {tl("demoUnlockNote", {
              price: ENTITLEMENT_PRICE_LABEL,
              days: ENTITLEMENT_DAYS,
            })}
          </div>
        </div>
      </aside>

      {/* Light working surface (the quiz) */}
      <div className="bg-surface-2 p-4 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
          {/* Quiz main — the SAME shared components the app's quiz pages use */}
          <QuizPanel>
            <QuizHead
              left={t("title")}
              right={
                <QuizScore
                  current={idx + 1}
                  total={QUESTIONS.length}
                  correct={correct}
                />
              }
            />
            <QuizProgress value={progress} />

            <QuestionCard question={q} chosen={chosen} onChoose={choose} />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
              <QuizButton variant="ghost" onClick={back} disabled={idx === 0}>
                Back
              </QuizButton>
              <QuizButton onClick={next} className="flex-1">
                {isLast ? "Restart demo ↻" : "Next question →"}
              </QuizButton>
            </div>
          </QuizPanel>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-[14px] border bg-surface p-4"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <h4 className="mb-2.5 text-xs" style={{ color: "var(--surface-ink-2)" }}>
                {t("progressAria")}
              </h4>
              <div className="flex gap-1.5">
                {Array.from({ length: QUESTIONS.length }).map((_, i) => {
                  const done = i < idx || (i === idx && answered);
                  const now = i === idx && !answered;
                  return (
                    <span
                      key={i}
                      className="grid size-[30px] place-items-center rounded-full font-display text-sm font-semibold"
                      style={{
                        background: done ? "var(--gold-400)" : "var(--surface-3)",
                        color: done ? "#2A1C0B" : "var(--surface-ink-2)",
                        boxShadow: now ? "inset 0 0 0 2px var(--gold-400)" : undefined,
                      }}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-[14px] border bg-surface p-4"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <h4 className="mb-2.5 text-xs" style={{ color: "var(--surface-ink-2)" }}>
                {t("confidence")}
              </h4>
              <div className="flex gap-2" role="group" aria-label={t("confidenceAria")}>
                {CONFIDENCE.map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    aria-pressed={confidence === i}
                    aria-label={c.label}
                    onClick={() => setConfidence(i)}
                    className="grid size-10 place-items-center rounded-full border transition-colors"
                    style={{
                      borderColor: confidence === i ? "var(--gold-400)" : "var(--surface-border-2)",
                      background: confidence === i ? "var(--warn-soft)" : "var(--surface)",
                      color: confidence === i ? "var(--warn)" : "var(--surface-ink-2)",
                    }}
                  >
                    <Icon name={c.icon} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-[14px] border bg-surface p-4"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <h4 className="mb-2 text-xs" style={{ color: "var(--surface-ink-2)" }}>
                Tip
              </h4>
              <div className="flex gap-2">
                <span className="text-warn">
                  <Icon name="i-bulb" size="sm" />
                </span>
                <p className="text-sm" style={{ color: "var(--surface-ink-2)" }}>
                  Read the sign&apos;s shape, colour and meaning together — it&apos;s the key to
                  safe driving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
