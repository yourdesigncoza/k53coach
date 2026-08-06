"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { ExternalLink, PenLine, Send, Sparkles, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  draftReportTitle,
  pushReportToLinear,
  setReportStatus,
} from "@/lib/feedback-actions";

/**
 * Triage controls. Push is manual and explicit — an admin reads the report,
 * optionally drafts a title, then decides. Nothing here fires automatically.
 */
export function FeedbackActions({
  id,
  status,
  linearUrl,
  linearIdentifier,
  hasAiTitle,
  editHref,
}: {
  id: string;
  status: string;
  linearUrl: string | null;
  linearIdentifier: string | null;
  hasAiTitle: boolean;
  editHref: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(success);
      else toast.error(result.error ?? "Failed");
    });
  }

  return (
    <Card className="mt-4">
      <CardContent className="flex flex-wrap items-center gap-2 py-3">
        {editHref && (
          <Button
            size="sm"
            variant="outline"
            render={
              <Link href={editHref}>
                <PenLine data-icon="inline-start" />
                Open in editor
              </Link>
            }
          />
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => draftReportTitle(id), "Title drafted")}
        >
          <Sparkles data-icon="inline-start" />
          {hasAiTitle ? "Re-draft title" : "Draft title"}
        </Button>

        {linearUrl ? (
          <Button
            size="sm"
            variant="secondary"
            render={
              <a href={linearUrl} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" />
                {linearIdentifier ?? "View in Linear"}
              </a>
            }
          />
        ) : (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await pushReportToLinear(id);
                if (result.ok) toast.success(`Pushed as ${result.identifier}`);
                else toast.error(result.error);
              })
            }
          >
            <Send data-icon="inline-start" />
            Push to Linear
          </Button>
        )}

        <span className="flex-1" />

        {status !== "resolved" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setReportStatus(id, "resolved"), "Marked resolved")}
          >
            <Check data-icon="inline-start" />
            Resolve
          </Button>
        )}
        {status !== "dismissed" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => setReportStatus(id, "dismissed"), "Dismissed")}
          >
            <X data-icon="inline-start" />
            Dismiss
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
