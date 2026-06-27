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
