"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  saveTranslation,
  resetTranslation,
  aiDraftAfrikaans,
} from "@/lib/translation-actions";
import type { CatalogRow } from "@/lib/translations";

type Filter = "all" | "overridden" | "untranslated";
const LOCALES = ["en", "af"] as const;
type Loc = (typeof LOCALES)[number];

const TOKEN_RE = /\{[^}]+\}/g;
const tokenSig = (s: string) => (s.match(TOKEN_RE) ?? []).sort().join(",");

const field =
  "w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-16 resize-y font-sans";

export function TranslationManager({ rows }: { rows: CatalogRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const namespaces = useMemo(
    () => Array.from(new Set(rows.map((r) => r.namespace))),
    [rows],
  );
  const counts = useMemo(
    () => ({
      total: rows.length,
      overridden: rows.filter((r) => r.enOverridden || r.afOverridden).length,
      untranslated: rows.filter((r) => r.untranslated).length,
    }),
    [rows],
  );

  // Match on the initial (server) props — rows stay mounted (so in-progress edits
  // survive filtering); we just toggle visibility.
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const set = new Set<string>();
    for (const r of rows) {
      const passFilter =
        filter === "all" ||
        (filter === "overridden" && (r.enOverridden || r.afOverridden)) ||
        (filter === "untranslated" && r.untranslated);
      const passSearch =
        !q ||
        `${r.namespace}.${r.key}`.toLowerCase().includes(q) ||
        r.en.toLowerCase().includes(q) ||
        r.af.toLowerCase().includes(q);
      if (passFilter && passSearch) set.add(`${r.namespace}.${r.key}`);
    }
    return set;
  }, [rows, search, filter]);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${counts.total})` },
    { id: "overridden", label: `Overridden (${counts.overridden})` },
    { id: "untranslated", label: `Untranslated (${counts.untranslated})` },
  ];

  return (
    <div className="mt-5">
      <div className="sticky top-14 z-10 flex flex-col gap-2 border-b border-border bg-background/95 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search key, English, or Afrikaans…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "outline"}
              onClick={() => setFilter(f.id)}
              className="rounded-lg"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {namespaces.map((ns) => {
        const nsRows = rows.filter((r) => r.namespace === ns);
        const anyVisible = nsRows.some((r) => matches.has(`${ns}.${r.key}`));
        return (
          <section key={ns} className={cn(!anyVisible && "hidden")}>
            <h2 className="mt-6 mb-1 text-sm font-semibold text-muted-foreground">
              {ns}
            </h2>
            <div className="divide-y divide-border">
              {nsRows.map((r) => (
                <TranslationRow
                  key={r.key}
                  row={r}
                  hidden={!matches.has(`${ns}.${r.key}`)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TranslationRow({ row, hidden }: { row: CatalogRow; hidden: boolean }) {
  const [vals, setVals] = useState<Record<Loc, string>>({
    en: row.en,
    af: row.af,
  });
  const [bases, setBases] = useState<Record<Loc, string>>({
    en: row.en,
    af: row.af,
  });
  const [overridden, setOverridden] = useState<Record<Loc, boolean>>({
    en: row.enOverridden,
    af: row.afOverridden,
  });
  const [saving, setSaving] = useState<Record<Loc, boolean>>({
    en: false,
    af: false,
  });
  const [drafting, setDrafting] = useState(false);

  const defaults: Record<Loc, string> = { en: row.enDefault, af: row.afDefault };
  const tokenMismatch =
    vals.af.trim() !== "" && tokenSig(vals.en) !== tokenSig(vals.af);

  async function save(loc: Loc) {
    setSaving((s) => ({ ...s, [loc]: true }));
    const res = await saveTranslation({
      namespace: row.namespace,
      key: row.key,
      locale: loc,
      value: vals[loc],
      defaultSeen: row.defaultHash,
    });
    setSaving((s) => ({ ...s, [loc]: false }));
    if (res.ok) {
      setBases((b) => ({ ...b, [loc]: vals[loc] }));
      setOverridden((o) => ({ ...o, [loc]: vals[loc] !== defaults[loc] && vals[loc].trim() !== "" }));
      toast.success(`Saved ${loc.toUpperCase()}`);
    } else if ("stale" in res && res.stale) {
      toast.error("Default changed — reload the page to edit the latest.");
    } else {
      toast.error(res.error ?? "Save failed");
    }
  }

  async function reset(loc: Loc) {
    setSaving((s) => ({ ...s, [loc]: true }));
    const res = await resetTranslation({
      namespace: row.namespace,
      key: row.key,
      locale: loc,
    });
    setSaving((s) => ({ ...s, [loc]: false }));
    if (res.ok) {
      setVals((v) => ({ ...v, [loc]: res.value }));
      setBases((b) => ({ ...b, [loc]: res.value }));
      setOverridden((o) => ({ ...o, [loc]: false }));
      toast.success(`Reset ${loc.toUpperCase()} to default`);
    } else {
      toast.error(res.error ?? "Reset failed");
    }
  }

  async function aiDraft() {
    setDrafting(true);
    const res = await aiDraftAfrikaans({ en: vals.en });
    setDrafting(false);
    if (res.ok) {
      setVals((v) => ({ ...v, af: res.draft }));
      toast.success("AI draft inserted — review, then Save.");
    } else if ("needsKey" in res && res.needsKey) {
      toast.info("No OPENAI_API_KEY set — type the translation manually.");
    } else {
      toast.error(res.error ?? "Draft failed");
    }
  }

  const status = overridden.en || overridden.af
    ? { label: "overridden", cls: "text-blue-700 dark:text-blue-300" }
    : vals.af.trim() === "" || vals.af === vals.en
      ? { label: "untranslated", cls: "text-amber-700 dark:text-amber-300" }
      : { label: "default", cls: "text-muted-foreground" };

  return (
    <div className={cn("grid gap-3 py-3 md:grid-cols-[170px_1fr_1fr]", hidden && "hidden")}>
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-medium" title={row.key}>
          {row.key}
        </p>
        <p className={cn("mt-0.5 text-[11px]", status.cls)}>{status.label}</p>
      </div>

      {LOCALES.map((loc) => {
        const dirty = vals[loc] !== bases[loc];
        return (
          <div key={loc} className="min-w-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] uppercase text-muted-foreground">
                {loc}
              </span>
              <div className="flex items-center gap-1">
                {loc === "af" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={aiDraft}
                    disabled={drafting}
                    title="AI draft Afrikaans"
                  >
                    {drafting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                  </Button>
                )}
                {overridden[loc] && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => reset(loc)}
                    disabled={saving[loc]}
                    title="Reset to shipped default"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={dirty ? "default" : "outline"}
                  className="h-7 px-2"
                  onClick={() => save(loc)}
                  disabled={!dirty || saving[loc]}
                  title="Save"
                >
                  {saving[loc] ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <textarea
              className={cn(field, dirty && "border-primary")}
              value={vals[loc]}
              onChange={(e) =>
                setVals((v) => ({ ...v, [loc]: e.target.value }))
              }
            />
            {loc === "af" && tokenMismatch && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3" />
                Placeholders differ from English ({tokenSig(vals.en) || "none"})
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
