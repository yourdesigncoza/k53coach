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
import type { QuestionRow } from "@/lib/questions";
import type { Topic } from "@/lib/types";

const TOPICS: Topic[] = ["signs", "rules", "controls"];
const field =
  "rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuestionList({ rows }: { rows: QuestionRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [status, setStatus] = useState<"all" | "draft" | "approved">("all");
  const [newTopic, setNewTopic] = useState<Topic>("signs");
  const [creating, setCreating] = useState(false);

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
        (!q || r.prompt.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)),
    );
  }, [rows, search, topic, status]);

  async function add() {
    setCreating(true);
    const res = await createQuestion(newTopic);
    setCreating(false);
    if (res.ok) router.push(`/admin/questions/${res.id}`);
    else toast.error(res.error ?? "Could not create question");
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search prompt or id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <select className={field} value={topic} onChange={(e) => setTopic(e.target.value as Topic | "all")}>
            <option value="all">All topics ({counts.total})</option>
            {TOPICS.map((tp) => (
              <option key={tp} value={tp}>{tp}</option>
            ))}
          </select>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value as "all" | "draft" | "approved")}>
            <option value="all">All status</option>
            <option value="approved">approved ({counts.approved})</option>
            <option value="draft">draft ({counts.draft})</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select className={field} value={newTopic} onChange={(e) => setNewTopic(e.target.value as Topic)}>
            {TOPICS.map((tp) => (
              <option key={tp} value={tp}>{tp}</option>
            ))}
          </select>
          <Button size="sm" className="rounded-lg" onClick={add} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add question
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No questions match.</p>
        )}
        {filtered.map((r) => (
          <Card key={r.id} size="sm">
            <CardContent className="py-0">
              <Link href={`/admin/questions/${r.id}`} className="flex items-center gap-3 py-2.5">
                <span className="flex flex-1 flex-col gap-1 min-w-0">
                  <span className="truncate text-sm font-medium">
                    {r.prompt || <span className="text-muted-foreground italic">(empty draft)</span>}
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
                    {r.in_readiness && <Badge variant="outline">readiness</Badge>}
                    <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
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
