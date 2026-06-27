"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { cn } from "@/lib/utils";
import { saveSign } from "@/lib/admin-actions";
import {
  SIGN_CONTENT_FIELDS,
  type SignContent,
  type SignContentField,
} from "@/lib/signs";

const FIELD_LABEL: Record<SignContentField, string> = {
  plainEnglish: "Plain English",
  formalMeaning: "Formal meaning",
  behaviour: "What the driver must do",
  commonMistake: "Common mistake",
  testHint: "Test hint",
};
const LOCALES = ["en", "af"] as const;
const ASSET_STATUSES = ["needs_review", "audited", "approved"];
const REVIEW_STATUSES = ["draft", "reviewed", "approved"];

const field =
  "w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SignEditor({
  code,
  name,
  svgFile,
  category,
  initialContent,
  initialAssetStatus,
  initialReviewStatus,
}: {
  code: string;
  name: string;
  svgFile: string | null;
  category: string;
  initialContent: SignContent;
  initialAssetStatus: string;
  initialReviewStatus: string;
}) {
  const [content, setContent] = useState<SignContent>(initialContent);
  const [assetStatus, setAssetStatus] = useState(initialAssetStatus);
  const [reviewStatus, setReviewStatus] = useState(initialReviewStatus);
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  function setField(f: SignContentField, locale: string, value: string) {
    setContent((c) => ({ ...c, [f]: { ...(c[f] ?? {}), [locale]: value } }));
  }

  async function aiDraft() {
    setDrafting(true);
    try {
      const res = await fetch("/api/admin/draft-sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      // Merge drafted EN fields, keep any existing AF.
      setContent((c) => {
        const next = { ...c };
        for (const f of SIGN_CONTENT_FIELDS) {
          const en = data.draft?.[f]?.en;
          if (en) next[f] = { ...(next[f] ?? {}), en };
        }
        return next;
      });
      toast[data.needsKey ? "info" : "success"](
        data.needsKey
          ? "No ANTHROPIC_API_KEY set — added empty fields to fill in."
          : "AI draft inserted into the English fields. Review before saving.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function onSave() {
    setBusy(true);
    const res = await saveSign({ code, content, assetStatus, reviewStatus });
    setBusy(false);
    if (res.ok) toast.success("Saved");
    else toast.error(res.error ?? "Save failed");
  }

  return (
    <div className="grid gap-5 md:grid-cols-[200px_1fr]">
      <div className="md:sticky md:top-20 md:self-start">
        <SignImage svgFile={svgFile} name={name} className="size-32" />
        <h1 className="mt-3 text-lg font-semibold">{name}</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          <Badge variant="secondary">{category}</Badge>
          <Badge variant="outline">{code}</Badge>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full rounded-xl"
          onClick={aiDraft}
          disabled={drafting}
        >
          {drafting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          AI draft (English)
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {SIGN_CONTENT_FIELDS.map((f) => (
          <Card key={f}>
            <CardContent className="py-4">
              <p className="mb-2 text-sm font-medium">{FIELD_LABEL[f]}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LOCALES.map((loc) => (
                  <label key={loc} className="block">
                    <span className="mb-1 block text-xs uppercase text-muted-foreground">
                      {loc}
                    </span>
                    <textarea
                      className={cn(field, "min-h-20 resize-y")}
                      value={content[f]?.[loc] ?? ""}
                      onChange={(e) => setField(f, loc, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="grid gap-3 py-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Asset status</span>
              <select
                className={field}
                value={assetStatus}
                onChange={(e) => setAssetStatus(e.target.value)}
              >
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">
                Review status
              </span>
              <select
                className={field}
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                {REVIEW_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>

        <Button
          onClick={onSave}
          disabled={busy}
          className="h-11 rounded-xl sm:w-40"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
    </div>
  );
}
