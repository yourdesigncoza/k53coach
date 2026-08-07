"use client";

/**
 * The content backlog this feature generates.
 *
 * Grouped by normalised question and sorted by count, because that is the
 * decision it supports: a question asked once is noise, a question asked eleven
 * times is the next lesson to write.
 */
import { useState } from "react";
import { purgeExpiredBodies } from "@/lib/coach-actions";
import { UNANSWERED_RETENTION_DAYS } from "@/lib/coach-privacy";
import { Button } from "@/components/ui/button";

export interface QueueRow {
  question: string;
  count: number;
  lastSeen: string;
  status: string;
}

export function CoachReviewQueue({ rows }: { rows: QueueRow[] }) {
  const [purged, setPurged] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function purge() {
    setBusy(true);
    const result = await purgeExpiredBodies();
    setPurged("purged" in result ? result.purged : -1);
    setBusy(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">
          Unanswered questions <span className="text-muted-foreground">({rows.length})</span>
        </h2>
        <div className="flex items-center gap-2 text-sm">
          {purged !== null && (
            <span className="text-muted-foreground">
              {purged < 0 ? "Purge failed" : `${purged} purged`}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => void purge()} disabled={busy}>
            Purge bodies older than {UNANSWERED_RETENTION_DAYS} days
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here. Either the corpus is covering what learners ask, or nobody has asked yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Asked</th>
                <th className="px-3 py-2 font-medium">Verdict</th>
                <th className="px-3 py-2 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.question} className="border-t border-border">
                  <td className="px-3 py-2">{row.question}</td>
                  <td className="px-3 py-2 tabular-nums">{row.count}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.lastSeen.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        <strong>refused</strong> never reached the model — the question did not look like a K53
        question. <strong>not_covered</strong> did reach it, and the verified passages did not
        answer it. The second kind is the content gap; the first is worth reading for false
        rejections.
      </p>
    </section>
  );
}
