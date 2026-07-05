"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createQuestion } from "@/lib/question-actions";
import { EXAM_FORMAT_B } from "@/lib/exam";
import type { QuestionRow } from "@/lib/questions";
import type { Topic } from "@/lib/types";

const TOPICS: Topic[] = ["signs", "rules", "controls"];
const TOPIC_LABEL: Record<Topic, string> = {
  signs: "Road Signs",
  rules: "Rules of the Road",
  controls: "Vehicle Controls",
};
const field =
  "rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Approved + in-exam + Code-B rows per topic — the live mock-exam pool for the
 *  default paper. Compared against EXAM_FORMAT_B section targets in the health strip. */
function codeBPoolCount(rows: QuestionRow[], topic: Topic): number {
  return rows.filter(
    (r) =>
      r.topic === topic &&
      r.review_status === "approved" &&
      r.in_exam &&
      (r.vehicle_codes ?? []).includes("B"),
  ).length;
}

export function QuestionList({ rows }: { rows: QuestionRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [status, setStatus] = useState<"all" | "draft" | "approved">("all");
  const [pool, setPool] = useState<"all" | "exam" | "not-exam">("all");
  const [creating, setCreating] = useState(false);

  const perTopic = useMemo(
    () =>
      Object.fromEntries(
        TOPICS.map((tp) => [tp, rows.filter((r) => r.topic === tp).length]),
      ) as Record<Topic, number>,
    [rows],
  );

  const health = useMemo(
    () =>
      EXAM_FORMAT_B.sections.map((sec) => ({
        topic: sec.topic,
        have: codeBPoolCount(rows, sec.topic),
        need: sec.count,
      })),
    [rows],
  );

  const counts = useMemo(
    () => ({
      total: rows.length,
      approved: rows.filter((r) => r.review_status === "approved").length,
      draft: rows.filter((r) => r.review_status === "draft").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (topic === "all" || r.topic === topic) &&
        (status === "all" || r.review_status === status) &&
        (pool === "all" ||
          (pool === "exam" ? r.in_exam : !r.in_exam)) &&
        (!q ||
          r.prompt.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)),
    );
  }, [rows, search, topic, status, pool]);

  async function add() {
    setCreating(true);
    const res = await createQuestion(topic === "all" ? "signs" : topic);
    setCreating(false);
    if (res.ok) router.push(`/admin/questions/${res.id}`);
    else toast.error(res.error ?? "Could not create question");
  }

  return (
    <div className="mt-5">
      {/* Pool-health strip: live Code B exam pool vs the format's section targets. */}
      <div className="grid gap-2 sm:grid-cols-3">
        {health.map((h) => {
          const short = h.have < h.need;
          return (
            <div
              key={h.topic}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm",
                short
                  ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{TOPIC_LABEL[h.topic]}</span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    short
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {h.have}/{h.need} {short ? "⚠" : "✓"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Code B exam pool
              </p>
            </div>
          );
        })}
      </div>

      {/* Section tabs. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["all", ...TOPICS] as const).map((tp) => (
          <button
            key={tp}
            onClick={() => setTopic(tp)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              topic === tp
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {tp === "all" ? "All" : TOPIC_LABEL[tp]}{" "}
            <span className="opacity-70">
              ({tp === "all" ? counts.total : perTopic[tp]})
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search prompt or id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <select
            className={field}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "all" | "draft" | "approved")
            }
          >
            <option value="all">All status</option>
            <option value="approved">approved ({counts.approved})</option>
            <option value="draft">draft ({counts.draft})</option>
          </select>
          <select
            className={field}
            value={pool}
            onChange={(e) =>
              setPool(e.target.value as "all" | "exam" | "not-exam")
            }
          >
            <option value="all">All questions</option>
            <option value="exam">In exam pool</option>
            <option value="not-exam">Not in exam pool</option>
          </select>
        </div>
        <Button size="sm" className="rounded-lg" onClick={add} disabled={creating}>
          {creating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add {topic === "all" ? "" : TOPIC_LABEL[topic] + " "}question
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No questions match.
          </p>
        )}
        {filtered.map((r) => (
          <Card key={r.id} size="sm">
            <CardContent className="py-0">
              <Link
                href={`/admin/questions/${r.id}`}
                className="flex items-center gap-3 py-2.5"
              >
                <span className="flex flex-1 flex-col gap-1 min-w-0">
                  <span className="truncate text-sm font-medium">
                    {r.prompt || (
                      <span className="text-muted-foreground italic">
                        (empty draft)
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{r.topic}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        r.review_status === "approved"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {r.review_status}
                    </Badge>
                    {r.in_exam && (
                      <Badge variant="outline">
                        exam · {r.exam_likelihood ?? "medium"}
                      </Badge>
                    )}
                    {r.in_readiness && <Badge variant="outline">readiness</Badge>}
                    {(r.vehicle_codes ?? []).length > 0 &&
                      (r.vehicle_codes ?? []).length < 4 && (
                        <Badge variant="outline" className="font-mono">
                          {(r.vehicle_codes ?? []).join("/")}
                        </Badge>
                      )}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.id}
                    </span>
                  </span>
                </span>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
