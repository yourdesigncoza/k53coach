import type { Tables, TablesUpdate } from "@/lib/database.types";

/** A road_signs row (DB1). */
export type SignRow = Tables<"road_signs">;
export type SignUpdate = TablesUpdate<"road_signs">;

/** Bilingual content field stored in road_signs.content (jsonb). */
export type LocalizedField = { en?: string; af?: string };

/** Shape of road_signs.content. All fields optional / filled via admin review. */
export type SignContent = {
  plainEnglish?: LocalizedField;
  formalMeaning?: LocalizedField;
  behaviour?: LocalizedField;
  commonMistake?: LocalizedField;
  testHint?: LocalizedField;
};

/** The editable content fields, in display order (used by the admin form). */
export const SIGN_CONTENT_FIELDS = [
  "plainEnglish",
  "formalMeaning",
  "behaviour",
  "commonMistake",
  "testHint",
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
