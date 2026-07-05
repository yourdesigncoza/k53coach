"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";
import { saveQuestion, deleteQuestion } from "@/lib/question-actions";
import type { Topic } from "@/lib/types";
import {
  VEHICLE_CODES,
  EXAM_LIKELIHOODS,
  type VehicleCode,
  type ExamLikelihood,
} from "@/lib/exam";

const TOPICS: Topic[] = ["signs", "rules", "controls"];
const field =
  "w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type QuestionEditorProps = {
  id: string;
  topic: Topic;
  difficulty: number;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  signCode: string | null;
  inReadiness: boolean;
  reviewStatus: "draft" | "approved";
  inExam: boolean;
  examLikelihood: ExamLikelihood;
  vehicleCodes: VehicleCode[];
  topicTag: string | null;
};

export function QuestionEditor(initial: QuestionEditorProps) {
  const router = useRouter();
  const [topic, setTopic] = useState<Topic>(initial.topic);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [prompt, setPrompt] = useState(initial.prompt);
  const [options, setOptions] = useState<string[]>(initial.options);
  const [answer, setAnswer] = useState(initial.answer);
  const [explanation, setExplanation] = useState(initial.explanation);
  const [signCode, setSignCode] = useState(initial.signCode ?? "");
  const [inReadiness, setInReadiness] = useState(initial.inReadiness);
  const [reviewStatus, setReviewStatus] = useState(initial.reviewStatus);
  const [inExam, setInExam] = useState(initial.inExam);
  const [examLikelihood, setExamLikelihood] = useState(initial.examLikelihood);
  const [vehicleCodes, setVehicleCodes] = useState<VehicleCode[]>(
    initial.vehicleCodes,
  );
  const [topicTag, setTopicTag] = useState(initial.topicTag ?? "");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  function toggleCode(code: VehicleCode) {
    setVehicleCodes((cs) =>
      cs.includes(code) ? cs.filter((c) => c !== code) : [...cs, code],
    );
  }

  function setOption(i: number, value: string) {
    setOptions((o) => o.map((v, idx) => (idx === i ? value : v)));
  }
  function addOption() {
    setOptions((o) => [...o, ""]);
  }
  function removeOption(i: number) {
    setOptions((o) => o.filter((_, idx) => idx !== i));
    setAnswer((a) => (a === i ? 0 : a > i ? a - 1 : a));
  }

  async function onSave() {
    setBusy(true);
    const res = await saveQuestion({
      id: initial.id,
      topic,
      difficulty,
      prompt,
      options,
      answer,
      explanation,
      signCode: signCode.trim() || null,
      inReadiness,
      reviewStatus,
      inExam,
      examLikelihood,
      vehicleCodes,
      topicTag: topicTag.trim() || null,
    });
    setBusy(false);
    if (res.ok) toast.success("Saved");
    else toast.error(res.error ?? "Save failed");
  }

  async function onDelete() {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setBusy(true);
    const res = await deleteQuestion(initial.id);
    setBusy(false);
    if (res.ok) {
      toast.success("Deleted");
      router.push("/admin/questions");
    } else toast.error(res.error ?? "Delete failed");
  }

  async function aiDraft() {
    setDrafting(true);
    try {
      const res = await fetch("/api/admin/draft-question", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, signCode: signCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      if (data.draft) {
        setPrompt(data.draft.prompt ?? "");
        if (Array.isArray(data.draft.options) && data.draft.options.length >= 2) {
          setOptions(data.draft.options);
          setAnswer(
            typeof data.draft.answer === "number" &&
              data.draft.answer < data.draft.options.length
              ? data.draft.answer
              : 0,
          );
        }
        setExplanation(data.draft.explanation ?? "");
      }
      toast[data.needsKey ? "info" : "success"](
        data.needsKey
          ? "No OPENAI_API_KEY set — fill the fields in manually."
          : "AI draft inserted. Review, then Save.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">{initial.id}</Badge>
        <Badge
          variant="outline"
          className={
            reviewStatus === "approved"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          }
        >
          {reviewStatus}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto rounded-lg"
          onClick={aiDraft}
          disabled={drafting}
        >
          {drafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI draft
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Topic</span>
            <select className={field} value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
              {TOPICS.map((tp) => (<option key={tp} value={tp}>{tp}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Difficulty</span>
            <select className={field} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
              {[1, 2, 3].map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Review status</span>
            <select className={field} value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as "draft" | "approved")}>
              <option value="draft">draft</option>
              <option value="approved">approved</option>
            </select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Prompt</span>
            <textarea className={cn(field, "min-h-16 resize-y")} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="mb-2 text-sm font-medium">Options — select the correct answer</p>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  checked={answer === i}
                  onChange={() => setAnswer(i)}
                  aria-label={`Mark option ${i + 1} correct`}
                  className="size-4 shrink-0"
                />
                <input className={field} value={opt} onChange={(e) => setOption(i, e.target.value)} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  aria-label="Remove option"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2 rounded-lg" onClick={addOption}>
            <Plus className="size-4" /> Add option
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Explanation</span>
            <textarea className={cn(field, "min-h-16 resize-y")} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="mb-3 text-sm font-medium">Mock exam pool</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inExam}
              onChange={(e) => setInExam(e.target.checked)}
              className="size-4"
            />
            Include in the mock exam pool
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">
                Exam likelihood (sampling weight)
              </span>
              <select
                className={field}
                value={examLikelihood}
                onChange={(e) =>
                  setExamLikelihood(e.target.value as ExamLikelihood)
                }
              >
                {EXAM_LIKELIHOODS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">
                Sub-topic (optional) — e.g. “Right of Way”
              </span>
              <input
                className={field}
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="Sub-topic label"
              />
            </label>
          </div>
          <div className="mt-3">
            <span className="mb-1.5 block text-xs font-medium">
              Vehicle codes this question applies to
            </span>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CODES.map((code) => (
                <label
                  key={code}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
                    vehicleCodes.includes(code)
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-input",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={vehicleCodes.includes(code)}
                    onChange={() => toggleCode(code)}
                    className="size-4"
                  />
                  {code}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">
              Sign code (optional) — must be an approved, SA-relevant sign
            </span>
            <input
              className={field}
              value={signCode}
              onChange={(e) => setSignCode(e.target.value)}
              placeholder="e.g. R1"
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inReadiness}
                onChange={(e) => setInReadiness(e.target.checked)}
                className="size-4"
              />
              Include in the free readiness test
            </label>
          </label>
          {signCode.trim() && (
            <SignImage
              svgFile={`signs/${signCode.trim()}.svg`}
              name={signCode.trim()}
              className="size-20 self-start rounded-lg bg-white p-1.5 ring-1 ring-border"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={busy} className="h-11 rounded-xl sm:w-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
        <Button variant="ghost" onClick={onDelete} disabled={busy} className="h-11 rounded-xl text-destructive">
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
    </div>
  );
}
