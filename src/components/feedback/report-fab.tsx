"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReportDialog } from "@/components/feedback/report-dialog";

/**
 * General bug reporter for the signed-in app shell.
 *
 * Sits above the mobile bottom nav (bottom-24) so it never covers a tab; on
 * md+ the nav is a left sidebar, so it drops to the normal corner inset.
 */
export function ReportFab() {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="icon-lg"
        variant="secondary"
        aria-label={t("bugTitle")}
        title={t("bugTitle")}
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 z-40 rounded-full border border-border/60 shadow-md md:right-6 md:bottom-6"
      >
        <Bug />
      </Button>
      <ReportDialog kind="bug" open={open} onOpenChange={setOpen} />
    </>
  );
}
