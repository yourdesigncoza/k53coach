/**
 * Shared helpers for the road-sign pipeline scripts (docs/sign-accuracy-pipeline.md):
 * .env.local loading, the service-role Supabase client, and the deterministic
 * name-matching used by the Phase 2 cross-check.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/** sha256 of a file under public/, or null if absent. Used for drift detection. */
export function publicSvgHash(svgFile) {
  if (!svgFile) return null;
  const p = resolve("public", svgFile);
  if (!existsSync(p)) return null;
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

/** Parse .env.local into a plain object (no external dep). */
export function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(".env.local"), "utf8").split(
      /\r?\n/,
    )) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — caller validates */
  }
  return env;
}

/** A service-role Supabase client (bypasses RLS). Exits if keys are absent. */
export function serviceClient() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Normalise a sign name for fuzzy comparison (drops punctuation + "sign"). */
export function normName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\bsign\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

/** Levenshtein similarity ratio in [0,1]. */
export function nameRatio(a, b) {
  if (!a && !b) return 1;
  const L = Math.max(a.length, b.length);
  return L ? 1 - levenshtein(a, b) / L : 1;
}

/** Fraction of the smaller token set that the two names share, in [0,1]. */
export function tokenOverlap(a, b) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let hits = 0;
  for (const t of A) if (B.has(t)) hits++;
  return hits / Math.min(A.size, B.size);
}

/**
 * Deterministic alignment of a Wikipedia-sourced sign against the chart authority.
 * Returns {alignment, score} where score in [0,1] is the best name signal.
 *  - not_in_chart : code absent from the official chart
 *  - aligned      : in chart + name agrees (high-confidence prior)
 *  - name_mismatch: in chart + chart name present + disagrees
 *  - ambiguous    : in chart but the chart gives no parseable name to compare
 */
export function classifyAlignment(wikiName, authority) {
  if (!authority) return { alignment: "not_in_chart", score: 0 };
  if (!authority.name) return { alignment: "ambiguous", score: 0 };
  const wn = normName(wikiName);
  const cn = normName(authority.name);
  const score = Math.max(nameRatio(wn, cn), tokenOverlap(wn, cn));
  if (score >= 0.6) return { alignment: "aligned", score };
  return { alignment: "name_mismatch", score };
}
