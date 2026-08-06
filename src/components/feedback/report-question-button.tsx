"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReportDialog, type ReportAnchor } from "@/components/feedback/report-dialog";

type Props = ReportAnchor & {
  /** Shown inside the dialog so the learner can see what they're flagging. */
  contextLabel?: string;
  className?: string;
};

/**
 * "This looks wrong" — the inline content reporter.
 *
 * The high-value half of this feature. A learner who has just read the item is
 * the cheapest detector we have for a mis-keyed answer or a wrong sign, and the
 * report arrives anchored to the exact row with its provenance snapshotted, so
 * triage starts from evidence rather than from "somewhere in the signs".
 *
 * Deliberately quiet: a small ghost link, never competing with the answer
 * buttons. It should be findable when someone is annoyed, invisible otherwise.
 */
export function ReportQuestionButton({
  questionId,
  signCode,
  objectiveCode,
  chosenIndex,
  contextLabel,
  className,
}: Props) {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setOpen(true)}
        className={
          className ?? "text-muted-foreground hover:text-foreground"
        }
      >
        <Flag data-icon="inline-start" />
        {t("flagAction")}
      </Button>
      <ReportDialog
        kind="content"
        open={open}
        onOpenChange={setOpen}
        anchor={{ questionId, signCode, objectiveCode, chosenIndex }}
        contextLabel={contextLabel}
      />
    </>
  );
}
