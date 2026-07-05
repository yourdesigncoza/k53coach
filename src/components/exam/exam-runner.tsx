"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { QuestionCard } from "@/components/quiz/question-card";
import {
  QuizHead,
  QuizProgress,
  QuizButton,
} from "@/components/quiz/quiz-chrome";
import { ExamTimer } from "@/components/quiz/exam-timer";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";
import { scoreExam, buildStoredAnswers, type ExamPaper } from "@/lib/exam";
import { bandFor } from "@/lib/readiness";
import {
  saveExamDraft,
  loadExamDraft,
  clearExamDraft,
} from "@/lib/exam-storage";
import type { Topic, TopicScore } from "@/lib/types";

type Phase = "intro" | "question" | "confirm";

interface RunnerState {
  paper: ExamPaper;
  answers: Record<string, number>;
  index: number; // flat index across all sections
  startedAt: string; // ISO
  timerEnabled: boolean;
}

/** Flatten the paper into a single question sequence with section boundaries. */
function flatten(paper: ExamPaper) {
  const items: {
    q: ExamPaper["sections"][number]["questions"][number];
    sectionIdx: number;
    topic: Topic;
    isSectionFirst: boolean;
    isSectionLast: boolean;
  }[] = [];
  paper.sections.forEach((sec, si) => {
    sec.questions.forEach((q, qi) => {
      items.push({
        q,
        sectionIdx: si,
        topic: sec.topic,
        isSectionFirst: qi === 0,
        isSectionLast: qi === sec.questions.length - 1,
      });
    });
  });
  return items;
}

export function ExamRunner({
  paper,
  timerEnabled,
}: {
  paper: ExamPaper;
  timerEnabled: boolean;
}) {
  const t = useTranslations("exam");
  const tt = useTranslations("topics");
  const router = useRouter();

  const [state, setState] = useState<RunnerState | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  // Initialise from a resumable draft, or start a fresh sitting. Runs once on
  // mount: localStorage + the wall-clock start time are client-only, so init
  // must happen post-mount (not in a lazy useState initializer) to avoid a
  // hydration mismatch. This is the sanctioned "sync from an external store"
  // case, so the synchronous setState here is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const draft = loadExamDraft();
    if (draft) {
      const deadline =
        new Date(draft.startedAt).getTime() +
        draft.paper.format.timeLimitSeconds * 1000;
      const stillValid = !draft.timerEnabled || Date.now() < deadline;
      if (stillValid) {
        setState({
          paper: draft.paper,
          answers: draft.answers,
          index: draft.index,
          startedAt: draft.startedAt,
          timerEnabled: draft.timerEnabled,
        });
        setPhase(draft.index > 0 ? "question" : "intro");
        return;
      }
      clearExamDraft();
    }
    const fresh: RunnerState = {
      paper,
      answers: {},
      index: 0,
      startedAt: new Date().toISOString(),
      timerEnabled,
    };
    setState(fresh);
    saveExamDraft(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const flat = useMemo(() => (state ? flatten(state.paper) : []), [state]);

  const persist = useCallback((next: RunnerState) => {
    setState(next);
    saveExamDraft(next);
  }, []);

  const submit = useCallback(
    async (auto: boolean) => {
      if (!state || submitted.current) return;
      submitted.current = true;
      setSubmitting(true);

      const score = scoreExam(state.paper, state.answers);
      const finishedAt = new Date();
      const durationSeconds = Math.round(
        (finishedAt.getTime() - new Date(state.startedAt).getTime()) / 1000,
      );

      const supabase = createClient();
      if (!supabase) {
        // Demo mode: nothing to persist. /mock is gated to signed-in users, so
        // this is only reachable without env — degrade to the start screen.
        clearExamDraft();
        toast.error(t("submitError"));
        setSubmitting(false);
        submitted.current = false;
        router.push("/mock");
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setSubmitting(false);
        submitted.current = false;
        toast.error(t("submitError"));
        return;
      }

      // Readiness snapshot from this sitting (straight per-topic accuracy; the
      // DB9 blend is layered on later).
      const byTopic: TopicScore[] = state.paper.sections.map((sec) => {
        const r = score.sections[sec.topic];
        return {
          topic: sec.topic,
          correct: r.correct,
          total: r.total,
          percent: r.total ? Math.round((r.correct / r.total) * 100) : 0,
        };
      });

      const { data: inserted, error } = await supabase
        .from("exam_attempts")
        .insert({
          user_id: user.id,
          vehicle_code: state.paper.format.vehicleCode,
          format: state.paper.format as unknown as Json,
          timer_enabled: state.timerEnabled,
          auto_submitted: auto,
          answers: buildStoredAnswers(state.paper, score) as unknown as Json,
          sections: score.sections as unknown as Json,
          overall: score.overall,
          passed: score.passed,
          started_at: state.startedAt,
          finished_at: finishedAt.toISOString(),
          duration_seconds: durationSeconds,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        // Keep the draft so the learner can retry without losing the sitting.
        submitted.current = false;
        setSubmitting(false);
        toast.error(t("submitError"));
        return;
      }

      // Dual-write per-question rows into `attempts` (feeds topic-accuracy /
      // DB7). Only answered questions — an unanswered question isn't an attempt.
      const attemptRows = score.answers
        .filter((a) => a.chosen !== null)
        .map((a) => ({
          user_id: user.id,
          question_id: a.id,
          topic: a.topic,
          chosen_index: a.chosen as number,
          correct: a.correct,
        }));
      if (attemptRows.length > 0) {
        await supabase.from("attempts").insert(attemptRows);
      }

      // Readiness snapshot so the dashboard ring tracks mock performance.
      await supabase.from("readiness_results").insert({
        user_id: user.id,
        overall: score.overall,
        band: bandFor(score.overall),
        by_topic: byTopic as unknown as Json,
      });

      clearExamDraft();
      router.push(`/mock/result/${inserted.id}`);
    },
    [state, router, t],
  );

  if (!state) {
    return (
      <QuizPanel>
        <div className="grid place-items-center py-10">
          <Loader2 className="size-6 animate-spin text-[var(--surface-ink-2)]" />
        </div>
      </QuizPanel>
    );
  }

  const current = flat[state.index];
  const section = state.paper.sections[current.sectionIdx];
  const deadline =
    new Date(state.startedAt).getTime() +
    state.paper.format.timeLimitSeconds * 1000;
  const answeredCount = Object.keys(state.answers).length;
  const total = flat.length;
  const progress = (state.index / total) * 100;

  function choose(optionIndex: number) {
    persist({
      ...state!,
      answers: { ...state!.answers, [current.q.id]: optionIndex },
    });
  }

  function advance() {
    if (current.isSectionLast && current.sectionIdx < state!.paper.sections.length - 1) {
      // Move to the next section's intro.
      persist({ ...state!, index: state!.index + 1 });
      setPhase("intro");
    } else if (state!.index < total - 1) {
      persist({ ...state!, index: state!.index + 1 });
    } else {
      setPhase("confirm");
    }
  }

  // ── Section intro ──
  if (phase === "intro") {
    return (
      <QuizPanel>
        <p className="text-sm font-medium text-copper-500">
          {t("sectionOf", {
            current: current.sectionIdx + 1,
            total: state.paper.sections.length,
          })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--surface-ink)]">
          {tt(section.topic)}
        </h1>
        <p className="mt-2 text-sm text-[var(--surface-ink-2)]">
          {t("sectionBrief", {
            count: section.questions.length,
            pass: section.passRequired,
          })}
        </p>
        {state.paper.shortened && current.sectionIdx === 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-3 text-xs text-[var(--surface-ink-2)]">
            <AlertTriangle className="size-4 shrink-0 text-amber-500" />
            {t("shortened")}
          </p>
        )}
        <div className="mt-5 flex">
          <QuizButton onClick={() => setPhase("question")} className="flex-1">
            {t("beginSection")}
          </QuizButton>
        </div>
      </QuizPanel>
    );
  }

  // ── Confirm & submit ──
  if (phase === "confirm") {
    const unanswered = total - answeredCount;
    return (
      <QuizPanel>
        <h1 className="font-display text-xl font-semibold text-[var(--surface-ink)]">
          {t("confirmTitle")}
        </h1>
        <p className="mt-2 text-sm text-[var(--surface-ink-2)]">
          {t("answeredSummary", { answered: answeredCount, total })}
        </p>
        {unanswered > 0 ? (
          <p className="mt-2 flex items-start gap-2 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {t("unansweredWarning", { count: unanswered })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-success">{t("allAnswered")}</p>
        )}
        <div className="mt-5 flex gap-2">
          <QuizButton
            variant="ghost"
            onClick={() => setPhase("question")}
            disabled={submitting}
          >
            {t("back")}
          </QuizButton>
          <QuizButton
            onClick={() => submit(false)}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? t("submitting") : t("submit")}
          </QuizButton>
        </div>
      </QuizPanel>
    );
  }

  // ── Question ──
  const chosen =
    current.q.id in state.answers ? state.answers[current.q.id] : null;
  return (
    <QuizPanel>
      <QuizHead
        left={tt(section.topic)}
        right={
          state.timerEnabled ? (
            <ExamTimer deadline={deadline} onExpire={() => submit(true)} />
          ) : (
            t("questionCounter", { current: state.index + 1, total })
          )
        }
      />
      <QuizProgress value={progress} />

      <QuestionCard
        question={current.q}
        chosen={chosen}
        onChoose={choose}
        mode="exam"
      />

      <div className="mt-5 flex">
        <QuizButton onClick={advance} className="flex-1">
          {current.isSectionLast &&
          current.sectionIdx === state.paper.sections.length - 1
            ? t("reviewSubmit")
            : t("next")}
        </QuizButton>
      </div>
    </QuizPanel>
  );
}
