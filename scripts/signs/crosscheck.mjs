#!/usr/bin/env node
/**
 * Phase 2 of the sign-accuracy pipeline (docs/sign-accuracy-pipeline.md).
 *
 * Deterministic cross-check of every road_signs row against the official chart
 * authority (data/chart-authority.json). Writes `alignment`, `chart_match` and a
 * provisional `sa_relevant` (= present in the chart). NO approvals happen here —
 * `alignment` is a prior the Phase-3 session verification consumes, not a gate.
 *
 * Usage: node scripts/signs/crosscheck.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serviceClient, classifyAlignment } from "./lib.mjs";

const supabase = serviceClient();
const authority = JSON.parse(
  readFileSync(resolve("data/chart-authority.json"), "utf8"),
);
const authMap = new Map(authority.map((a) => [a.code, a]));

// Pull every sign (sign_id is the stable PK we upsert back on).
const { data: signs, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, name");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const counts = {};
const rows = signs.map((s) => {
  const a = authMap.get(s.code) ?? null;
  const { alignment, score } = classifyAlignment(s.name, a);
  counts[alignment] = (counts[alignment] ?? 0) + 1;
  return {
    sign_id: s.sign_id,
    alignment,
    sa_relevant: alignment !== "not_in_chart",
    chart_match: a
      ? { code: a.code, name: a.name, page: a.page, score: Number(score.toFixed(3)) }
      : null,
  };
});

// Per-row UPDATE (not upsert): a partial upsert would re-evaluate the NOT NULL
// `code`/`name` columns on the INSERT branch and fail.
let ok = 0;
for (let i = 0; i < rows.length; i += 25) {
  const batch = rows.slice(i, i + 25);
  const results = await Promise.all(
    batch.map(({ sign_id, ...patch }) =>
      supabase.from("road_signs").update(patch).eq("sign_id", sign_id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error(`batch ${i}: ${failed.error.message}`);
    process.exit(1);
  }
  ok += batch.length;
}

console.log(`Cross-checked ${ok} signs.`);
console.log("alignment:", counts);
const inChart = rows.filter((r) => r.sa_relevant).length;
console.log(`in-chart (sa_relevant, Phase-3 input): ${inChart}`);
