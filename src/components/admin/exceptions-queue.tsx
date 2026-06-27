"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, Check, Ban, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { bulkSignAction } from "@/lib/admin-actions";

/** One serialisable row for the exceptions queue. */
export type QueueRow = {
  code: string;
  name: string;
  svgFile: string | null;
  alignment: string;
  chartName: string | null;
  chartPage: number | null;
  confidence: number | null;
  reason: string | null;
  suggestedName: string | null;
  contentIssue: string | null;
};

/** Chart sheets we ship a reference image for (public/chart-pages/). */
const CHART_PAGES_AVAILABLE = new Set([1, 2]);

export function ExceptionsQueue({ rows }: { rows: QueueRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<null | "approve" | "exclude">(null);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Exceptions queue is empty — every in-chart sign is either approved or
          excluded. 🎉
        </CardContent>
      </Card>
    );
  }

  function toggle(code: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) =>
      s.size === rows.length ? new Set() : new Set(rows.map((r) => r.code)),
    );
  }

  async function run(action: "approve" | "exclude") {
    if (selected.size === 0) return;
    setBusy(action);
    const res = await bulkSignAction([...selected], action);
    setBusy(null);
    if (res.ok) {
      toast.success(
        `${action === "approve" ? "Approved" : "Excluded"} ${res.count} sign(s)`,
      );
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(res.error ?? "Action failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-lg" onClick={toggleAll}>
          {selected.size === rows.length ? "Clear" : "Select all"}
        </Button>
        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            className="rounded-lg"
            disabled={selected.size === 0 || busy !== null}
            onClick={() => run("approve")}
          >
            {busy === "approve" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={selected.size === 0 || busy !== null}
            onClick={() => run("exclude")}
          >
            {busy === "exclude" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ban className="size-4" />
            )}
            Exclude
          </Button>
        </div>
      </div>

      {rows.map((r) => (
        <Card key={r.code}>
          <CardContent className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              checked={selected.has(r.code)}
              onChange={() => toggle(r.code)}
              aria-label={`Select ${r.code}`}
            />
            <SignImage svgFile={r.svgFile} name={r.name} className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{r.code}</span>
                <span className="text-sm font-medium">{r.name}</span>
                <Badge variant="outline">{r.alignment}</Badge>
                {r.confidence != null && (
                  <Badge variant="secondary">conf {r.confidence.toFixed(2)}</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Chart:</span>{" "}
                {r.chartName ?? "—"}
                {r.chartPage != null && ` (p.${r.chartPage})`}
                {r.suggestedName && r.suggestedName !== r.name && (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground">Suggested:</span>{" "}
                    {r.suggestedName}
                  </>
                )}
              </p>
              {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
              {r.contentIssue && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Content: {r.contentIssue}
                </p>
              )}
              <div className="mt-1.5 flex gap-3 text-xs">
                <Link
                  href={`/admin/signs/${encodeURIComponent(r.code)}`}
                  className="font-medium text-primary hover:underline"
                >
                  Open editor
                </Link>
                {r.chartPage != null && CHART_PAGES_AVAILABLE.has(r.chartPage) && (
                  <a
                    href={`/chart-pages/page-${r.chartPage}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                  >
                    Official chart p.{r.chartPage} <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
