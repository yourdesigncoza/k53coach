/**
 * The Ask Coach corpus — every verified passage the coach may ground an answer
 * on, and nothing else (docs/product/PRD-ask-coach.md §5).
 *
 * Four sources, all already in the app: approved road signs, approved questions
 * and their explanations, the road-rules library and the vehicle-controls
 * library. No new content is authored for this feature — if the coach cannot
 * answer from what a learner could already read in `/learn`, the honest answer
 * is that we do not cover it yet.
 *
 * This module is deliberately PURE: it takes rows, it returns passages. The
 * database read lives in `coach-corpus-server.ts`, so the retrieval unit tests
 * can build a real corpus from the real content files without a network call —
 * and so a stale snapshot can be diffed against a live build.
 *
 * Value imports stay relative with an explicit `.ts` extension: this runs under
 * `node --experimental-strip-types`, which does not resolve the "@/" alias for
 * values.
 */
import { createHash } from "node:crypto";
import { ROAD_RULES } from "../content/road-rules.ts";
import { VEHICLE_CONTROLS } from "../content/vehicle-controls.ts";

export type PassageKind = "sign" | "rule" | "control" | "question";

export interface Passage {
  /** Stable across builds: "sign:R1", "rule:RR12", "control:VC6", "q:q-signs-5". */
  id: string;
  kind: PassageKind;
  /** The learning-objective code. What the model cites and what the UI links. */
  code: string;
  title: string;
  /** The teaching prose, one blob. This is what gets indexed and cited. */
  body: string;
  /** Must resolve — the source chip links here. */
  href: string;
  /** sha256 of `body`. The evidence anchor: proves what the coach was reading. */
  hash: string;
  /**
   * The one-line verified meaning, per locale — what the extractive fast-path
   * renders instead of generating (PRD §4). Only signs carry an `af` lead, since
   * only signs have Afrikaans bodies; where it is missing the question falls
   * through to guarded generation, which is the honest behaviour rather than
   * serving English prose on /af.
   */
  lead: { en: string; af?: string };
}

export interface Corpus {
  /** sha256 over every passage hash. Recorded on each answer. */
  revision: string;
  builtAt: number;
  passages: Passage[];
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Assemble one passage from its parts.
 *
 * Empty and duplicate parts are dropped rather than joined: six of the served
 * signs shipped with `content` of `{}` for a while (CLAUDE.md), and a passage
 * that is nothing but its own title would retrieve on the title and then ground
 * an answer on no teaching at all — worse than not existing, because it looks
 * like coverage.
 */
export function makePassage(input: {
  kind: PassageKind;
  code: string;
  title: string;
  href: string;
  parts: (string | null | undefined)[];
  lead?: { en?: string; af?: string };
}): Passage | null {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of input.parts) {
    const part = (raw ?? "").trim();
    if (!part || seen.has(part)) continue;
    seen.add(part);
    parts.push(part);
  }
  if (!parts.length) return null;
  const body = parts.join(" ");
  return {
    id: `${idPrefix(input.kind)}:${input.code}`,
    kind: input.kind,
    code: input.code,
    title: input.title.trim(),
    body,
    href: input.href,
    hash: sha256(body),
    lead: {
      en: (input.lead?.en ?? "").trim(),
      ...(input.lead?.af?.trim() ? { af: input.lead.af.trim() } : {}),
    },
  };
}

function idPrefix(kind: PassageKind): string {
  return kind === "question" ? "q" : kind;
}

// ── sources ──────────────────────────────────────────────────────────────────

/** The subset of a `road_signs` row this needs. Structural, so plain scripts can pass literals. */
export interface SignSource {
  code: string;
  name: string;
  category: string | null;
  content: Record<string, unknown> | null;
}

function loc(content: Record<string, unknown> | null, field: string, locale: string): string {
  const f = (content?.[field] ?? null) as Record<string, string> | null;
  if (!f) return "";
  return f[locale] || f.en || "";
}

/**
 * Signs are the only source with real Afrikaans bodies, so both locales are
 * indexed into one passage. Rules, controls and question explanations are
 * English-only until the deferred content pass — which is why an Afrikaans query
 * has to expand to English in retrieval rather than matching Afrikaans text that
 * mostly is not there (PRD §5).
 */
export function signPassage(row: SignSource): Passage | null {
  const nameAf = loc(row.content, "name", "af");
  return makePassage({
    kind: "sign",
    code: row.code,
    title: row.name,
    href: `/learn/road-signs/${row.code}`,
    parts: [
      row.name,
      nameAf && nameAf !== row.name ? nameAf : null,
      row.category,
      ...["plainEnglish", "formalMeaning", "behaviour", "commonMistake", "testHint", "memoryTrick"].flatMap(
        (field) => [loc(row.content, field, "en"), loc(row.content, field, "af")],
      ),
    ],
    lead: { en: loc(row.content, "plainEnglish", "en"), af: loc(row.content, "plainEnglish", "af") },
  });
}

export interface QuestionSource {
  id: string;
  topic: string | null;
  prompt: string;
  options: unknown;
  answer: number | null;
  explanation: string | null;
  objective_code: string | null;
}

const TOPIC_SLUG: Record<string, string> = {
  signs: "road-signs",
  rules: "rules",
  controls: "controls",
};

/**
 * A question contributes its prompt, its KEYED option and its explanation.
 *
 * The distractors are deliberately left out. They are plausible-sounding wrong
 * statements about road law written to be tempting, and indexing them would put
 * text in the grounding window that the coach must never repeat as fact.
 */
export function questionPassage(row: QuestionSource): Passage | null {
  const options = Array.isArray(row.options) ? (row.options as unknown[]) : [];
  const keyed =
    typeof row.answer === "number" && row.answer >= 0 && row.answer < options.length
      ? String(options[row.answer] ?? "")
      : "";
  const slug = TOPIC_SLUG[row.topic ?? ""] ?? "rules";
  return makePassage({
    kind: "question",
    code: row.objective_code || row.id,
    title: row.prompt,
    href: row.objective_code && row.topic === "signs"
      ? `/learn/road-signs/${row.objective_code}`
      : `/learn/${slug}`,
    parts: [row.prompt, keyed, row.explanation],
    lead: { en: row.explanation ?? "" },
  });
}

export function rulePassages(): Passage[] {
  return ROAD_RULES.map((r) =>
    makePassage({
      kind: "rule",
      code: r.code,
      title: r.title,
      href: `/learn/rules/${r.code}`,
      parts: [r.title, r.category, r.summary, r.rule, r.whatToDo, r.commonMistake, r.testHint],
      lead: { en: [r.summary, r.rule].filter(Boolean).join(" ") },
    }),
  ).filter((p): p is Passage => p !== null);
}

export function controlPassages(): Passage[] {
  return VEHICLE_CONTROLS.map((c) =>
    makePassage({
      kind: "control",
      code: c.code,
      title: c.name,
      href: `/learn/controls/${c.code}`,
      parts: [c.name, c.category, c.summary, c.whatItDoes, c.howToUse, c.commonMistake, c.testHint],
      lead: { en: [c.summary, c.whatItDoes].filter(Boolean).join(" ") },
    }),
  ).filter((p): p is Passage => p !== null);
}

/**
 * Build the corpus from already-fetched rows.
 *
 * The count is never hardcoded anywhere: CLAUDE.md's sign figure was 24 short
 * within three days of being measured, and it warns about exactly that drift.
 */
export function buildCorpus(signs: SignSource[], questions: QuestionSource[]): Corpus {
  const passages = [
    ...signs.map(signPassage),
    ...questions.map(questionPassage),
    ...rulePassages(),
    ...controlPassages(),
  ].filter((p): p is Passage => p !== null);

  return {
    revision: sha256(passages.map((p) => p.hash).join("")).slice(0, 16),
    builtAt: Date.now(),
    passages,
  };
}
