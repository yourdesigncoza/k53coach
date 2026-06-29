"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/queries";
import { getDefault, defaultHash, TRANSLATIONS_TAG } from "@/lib/translations";
import { llmChat, hasLlmKey } from "@/lib/llm";

type SaveInput = {
  namespace: string;
  key: string;
  locale: string;
  value: string;
  /** The defaultHash the editor saw — guards against the JSON default drifting. */
  defaultSeen: string;
};

/**
 * Upsert (or delete) one override. The DB holds overrides only: if the new value
 * equals the *server's* current JSON default (or is blank) the row is deleted, so
 * the string reverts to the shipped default. Decided on server truth, never on
 * the client's idea of the default — and rejected as `stale` if the default
 * drifted since the editor loaded. Admin-only (gate + RLS). `updateTag` makes the
 * change live on the next request.
 */
export async function saveTranslation(input: SaveInput) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase)
    return { ok: false as const, error: "Supabase not configured" };

  if (defaultHash(input.namespace, input.key) !== input.defaultSeen) {
    return {
      ok: false as const,
      stale: true as const,
      error: "The default changed since you loaded — refresh to see the latest.",
    };
  }

  const currentDefault = getDefault(input.namespace, input.key, input.locale) ?? "";
  const value = input.value;
  const match = {
    locale: input.locale,
    namespace: input.namespace,
    key: input.key,
  };

  if (value === currentDefault || value.trim() === "") {
    const { error } = await supabase.from("ui_translations").delete().match(match);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("ui_translations").upsert({
      ...match,
      value,
      updated_by: auth.user?.id ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false as const, error: error.message };
  }

  updateTag(TRANSLATIONS_TAG);
  return { ok: true as const };
}

/** Delete the override for ONE locale only (never clobbers the other locale). */
export async function resetTranslation(input: {
  namespace: string;
  key: string;
  locale: string;
}) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  const supabase = await createClient();
  if (!supabase)
    return { ok: false as const, error: "Supabase not configured" };

  const { error } = await supabase.from("ui_translations").delete().match(input);
  if (error) return { ok: false as const, error: error.message };

  updateTag(TRANSLATIONS_TAG);
  return { ok: true as const, value: getDefault(input.namespace, input.key, input.locale) ?? "" };
}

/**
 * Draft an Afrikaans translation of an English UI string for human review. Routes
 * through the single LLM entry point (`@/lib/llm`); never auto-saved.
 */
export async function aiDraftAfrikaans(input: { en: string }) {
  if (!(await isAdmin())) return { ok: false as const, error: "Not authorised" };
  if (!hasLlmKey())
    return {
      ok: false as const,
      needsKey: true as const,
      error: "No OPENAI_API_KEY set.",
    };
  try {
    const draft = await llmChat({
      system:
        "You are a professional South African Afrikaans translator for a K53 " +
        "learner-driver app. Translate the English UI string into natural SA " +
        "Afrikaans. Preserve any {placeholder} tokens EXACTLY as written. Return " +
        "ONLY the translation — no quotes, no commentary.",
      user: input.en,
      maxTokens: 200,
      temperature: 0.2,
    });
    return { ok: true as const, draft: draft.trim() };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Draft failed",
    };
  }
}
