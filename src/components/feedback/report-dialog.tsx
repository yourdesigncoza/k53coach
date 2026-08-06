"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MIN_WORDS, countWords, type ReportKind } from "@/lib/feedback";
import { submitReport } from "@/lib/feedback-actions";
import { collectClientContext } from "@/components/feedback/feedback-telemetry";

export type ReportAnchor = {
  questionId?: string | null;
  signCode?: string | null;
  objectiveCode?: string | null;
  chosenIndex?: number | null;
};

type Props = {
  kind: ReportKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being flagged. Empty for a general bug report. */
  anchor?: ReportAnchor;
  /** Shown above the textarea so the learner can see what they're flagging. */
  contextLabel?: string;
};

/**
 * One dialog for both report kinds — same validation, same submit path, same
 * copy discipline. A second implementation would drift, and this is the surface
 * where drift is least visible (nobody looks at the bug reporter until it's the
 * thing that's broken).
 */
export function ReportDialog({
  kind,
  open,
  onOpenChange,
  anchor,
  contextLabel,
}: Props) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const words = countWords(body);
  const canSubmit = words >= MIN_WORDS && !pending;

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitReport({
        kind,
        body,
        questionId: anchor?.questionId ?? null,
        signCode: anchor?.signCode ?? null,
        objectiveCode: anchor?.objectiveCode ?? null,
        chosenIndex: anchor?.chosenIndex ?? null,
        client: collectClientContext(locale),
      });

      if (result.ok) {
        setBody("");
        onOpenChange(false);
        toast.success(t("thanks"));
        return;
      }

      const message =
        result.error === "rate_limit"
          ? t("errorRateLimit")
          : result.error === "auth"
            ? t("errorAuth")
            : result.error === "too_short"
              ? t("errorTooShort", { count: MIN_WORDS })
              : t("errorGeneric");
      toast.error(message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "content" ? t("contentTitle") : t("bugTitle")}
          </DialogTitle>
          <DialogDescription>
            {kind === "content" ? t("contentIntro") : t("bugIntro")}
          </DialogDescription>
        </DialogHeader>

        {contextLabel ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {contextLabel}
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={kind === "content" ? t("contentPlaceholder") : t("bugPlaceholder")}
            className="min-h-28"
            autoFocus
          />
          <p
            className={
              words >= MIN_WORDS
                ? "text-xs text-muted-foreground"
                : "text-xs text-muted-foreground/80"
            }
          >
            {t("wordCount", { count: words, min: MIN_WORDS })}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? t("sending") : t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
