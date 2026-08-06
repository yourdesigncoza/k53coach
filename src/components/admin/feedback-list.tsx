"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { AlertTriangle, ExternalLink, Flag, Bug } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clamp } from "@/lib/feedback";

export type FeedbackRow = {
  id: string;
  kind: string;
  body: string;
  user_email: string;
  question_id: string | null;
  sign_code: string | null;
  objective_code: string | null;
  status: string;
  ai_title: string | null;
  ai_priority: string | null;
  linear_identifier: string | null;
  linear_issue_url: string | null;
  created_at: string;
  /**
   * Computed on the server. Reading the clock during render is impure and would
   * also hydrate differently from the server pass.
   */
  stale: boolean;
};

const STATUS_FILTERS = [
  { key: "open", label: "Open" },
  { key: "new", label: "Untriaged" },
  { key: "pushed", label: "In Linear" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

const KIND_FILTERS = [
  { key: "all", label: "All kinds" },
  { key: "content", label: "Content flags" },
  { key: "bug", label: "Bugs" },
];

function statusVariant(status: string) {
  if (status === "resolved") return "secondary" as const;
  if (status === "dismissed") return "outline" as const;
  return "default" as const;
}

export function FeedbackList({
  rows,
  status,
  kind,
}: {
  rows: FeedbackRow[];
  status: string;
  kind: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setFilter(next: { status?: string; kind?: string }) {
    const params = new URLSearchParams({
      status: next.status ?? status,
      kind: next.kind ?? kind,
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            size="xs"
            variant={status === f.key ? "default" : "outline"}
            onClick={() => setFilter({ status: f.key })}
          >
            {f.label}
          </Button>
        ))}
        <span className="mx-1 w-px bg-border" aria-hidden />
        {KIND_FILTERS.map((f) => (
          <Button
            key={f.key}
            size="xs"
            variant={kind === f.key ? "default" : "outline"}
            onClick={() => setFilter({ kind: f.key })}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing here. No reports match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {rows.map((r) => {
            const anchor = r.question_id ?? r.sign_code ?? r.objective_code;
            return (
              <Card key={r.id} className="py-0">
                <CardContent className="py-0">
                  <Link
                    href={`/admin/feedback/${r.id}`}
                    className="flex items-start gap-3 py-3 md:py-3.5"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
                      {r.kind === "content" ? (
                        <Flag className="size-4" />
                      ) : (
                        <Bug className="size-4" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {r.ai_title ?? clamp(r.body.replace(/\s+/g, " ").trim(), 70)}
                        </span>
                        {anchor && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {anchor}
                          </Badge>
                        )}
                        <Badge variant={statusVariant(r.status)} className="text-[10px]">
                          {r.status}
                        </Badge>
                        {r.ai_priority && (
                          <Badge variant="outline" className="text-[10px]">
                            {r.ai_priority}
                          </Badge>
                        )}
                        {r.stale && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
                            title="Untriaged for over a week"
                          >
                            <AlertTriangle className="size-3" /> stale
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {r.user_email} ·{" "}
                        {new Date(r.created_at).toLocaleString("en-ZA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {r.linear_identifier ? ` · ${r.linear_identifier}` : ""}
                      </span>
                    </span>

                    {r.linear_issue_url && (
                      <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
