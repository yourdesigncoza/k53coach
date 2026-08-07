import type { Tables, TablesUpdate } from "@/lib/database.types";

/** A road_signs row (DB1). */
export type SignRow = Tables<"road_signs">;
export type SignUpdate = TablesUpdate<"road_signs">;

/** Bilingual content field stored in road_signs.content (jsonb). */
export type LocalizedField = { en?: string; af?: string };

/**
 * Who signed off the AFRIKAANS half of a sign's content, and when.
 *
 * Constraint 9 is that the accuracy gate is *recorded evidence, not intent* — so
 * AI-drafted Afrikaans that nobody has read must say so somewhere a query can
 * find it, or it is indistinguishable from reviewed content the moment anyone
 * acts on it.
 *
 * Deliberately separate from the row's `approved_by` / `verified_at`, which
 * record approval of the ENGLISH content against the official chart. Overwriting
 * those to express "the Afrikaans is unreviewed" would destroy the English
 * sign-off to record the absence of a different one.
 *
 * Find everything still unreviewed with:
 *   content->afReview->>humanSignOff = 'false'
 */
export type AfReview = {
  humanSignOff: boolean;
  /** How the Afrikaans got here — `ai` until a person has been through it. */
  draftedBy: "ai" | "human";
  /** ISO date the draft was written. */
  draftedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

/** Shape of road_signs.content. All fields optional / filled via admin review. */
export type SignContent = {
  /**
   * Afrikaans sign name. The ENGLISH name lives in the `road_signs.name`
   * column and stays the single source of truth — only `af` is stored here, so
   * there is no second copy of the English to drift out of step. Read it with
   * `signName()`, never directly.
   *
   * Deliberately NOT in `SIGN_CONTENT_FIELDS`: that array drives the admin
   * content grid, which renders an EN box per field, and an EN box here would
   * write a shadow English name that nothing reads.
   */
  name?: LocalizedField;
  /** Sign-off state of the Afrikaans content. See `AfReview`. */
  afReview?: AfReview;
  /**
   * Sign-off state of the Afrikaans NAME alone, which travels separately from
   * the lesson text: Louwrens reviewed all 381 names in one sheet (K53-51) while
   * the 1 914 lesson fields stay unread. One marker for both would have had to
   * claim either that the names are unreviewed or that the lessons are.
   */
  nameReview?: AfReview;
  plainEnglish?: LocalizedField;
  formalMeaning?: LocalizedField;
  behaviour?: LocalizedField;
  commonMistake?: LocalizedField;
  testHint?: LocalizedField;
  /** Short mnemonic that makes the meaning stick (client request, K53-30). */
  memoryTrick?: LocalizedField;
};

/** The editable content fields, in display order (used by the admin form). */
export const SIGN_CONTENT_FIELDS = [
  "plainEnglish",
  "formalMeaning",
  "behaviour",
  "commonMistake",
  "testHint",
  "memoryTrick",
] as const;
export type SignContentField = (typeof SIGN_CONTENT_FIELDS)[number];

export function signContent(row: Pick<SignRow, "content">): SignContent {
  return (row.content ?? {}) as SignContent;
}

/** Pick a localized string: requested locale → English → empty. */
export function localize(field: LocalizedField | undefined, locale: string) {
  if (!field) return "";
  return field[locale as keyof LocalizedField] || field.en || "";
}

/**
 * The sign's name in the requested locale, falling back to English.
 *
 * Every learner-facing surface must go through this rather than reading
 * `row.name`, or /af shows an English name above Afrikaans lesson prose. Admin
 * screens deliberately keep `row.name`: the admin UI is English-only, and a
 * reviewer needs the canonical name to match against the official chart.
 */
export function signName(
  row: Pick<SignRow, "name" | "content">,
  locale: string,
): string {
  return localize({ ...signContent(row).name, en: row.name }, locale);
}

export const SIGN_CATEGORY_LABEL: Record<string, string> = {
  regulatory: "Regulatory",
  warning: "Warning",
  guidance: "Guidance",
  marking: "Road Marking",
};

export const SIGN_CATEGORY_ORDER = [
  "regulatory",
  "warning",
  "guidance",
  "marking",
] as const;

/** A sign is learner-ready only when both gates are approved. */
export function isShippable(row: SignRow) {
  return row.asset_status === "approved" && row.review_status === "approved";
}

/** Deterministic cross-check outcome vs the official DoT chart (Phase 2). */
export type SignAlignment =
  | "unverified"
  | "aligned"
  | "not_in_chart"
  | "name_mismatch"
  | "ambiguous";

/** road_signs.chart_match jsonb — the matched chart-authority record. */
export type ChartMatch = {
  code: string;
  name: string | null;
  page: number | null;
  score: number;
};

/** road_signs.verification jsonb — session verification evidence (Phase 3). */
export type SignVerification = {
  confidence: number;
  reason: string;
  visionPass: boolean;
  semanticPass: boolean;
};

export function chartMatch(row: Pick<SignRow, "chart_match">): ChartMatch | null {
  return (row.chart_match ?? null) as ChartMatch | null;
}

export function signVerification(
  row: Pick<SignRow, "verification">,
): (SignVerification & {
  match?: boolean;
  contentPass?: boolean;
  suggestedName?: string | null;
  contentIssue?: string | null;
  exclusionReason?: string | null;
  primarySource?: string | null;
  family?: string | null;
}) | null {
  return (row.verification ?? null) as never;
}

/**
 * A sign needs human attention when it is SA-relevant (belongs in the official
 * chart) but is not yet fully shippable. not-in-chart signs are already decided
 * (excluded), so they are not in the queue.
 */
export function isInExceptionsQueue(
  row: Pick<SignRow, "sa_relevant" | "asset_status" | "review_status">,
) {
  return Boolean(row.sa_relevant) && !isShippable(row as SignRow);
}
