"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { resetProgress } from "@/lib/progress-actions";

/** Reset-my-progress control: confirm → delete attempts/readiness/mock history. */
export function ResetProgressButton() {
  const t = useTranslations("progressPage");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onReset() {
    if (!confirm(t("resetConfirm"))) return;
    setBusy(true);
    const res = await resetProgress();
    setBusy(false);
    if (res.ok) {
      toast.success(t("resetDone"));
      router.refresh();
    } else {
      toast.error(res.error ?? "Reset failed");
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={onReset}
      disabled={busy}
      className="h-11 rounded-xl"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RotateCcw className="size-4" />
      )}
      {t("reset")}
    </Button>
  );
}
