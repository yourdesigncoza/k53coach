#!/usr/bin/env node
/**
 * Phase 3 (step 3) of the sign-accuracy pipeline (docs/sign-accuracy-pipeline.md).
 *
 * Applies the session verdicts (data/verify/verdicts/<code>.json) to road_signs.
 * Decision per sign:
 *   - match && visionPass && semanticPass && confidence >= 0.85
 *       -> asset_status = 'approved', write contentDraft to content.<field>.en,
 *          svg_hash, approved_by, verification, verified_at.
 *          review_status = 'approved' ONLY if contentPass (the agent's content
 *          factuality self-check) is also true; else content stays for the human.
 *   - otherwise -> statuses untouched (human exceptions queue), but verification
 *     evidence + reason are still recorded so the admin view can show them.
 *
 * Idempotent. Pass --dry-run to preview counts without writing.
 * Usage: node scripts/signs/apply-verdicts.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { serviceClient, mergeContentEn } from "./lib.mjs";

const DRY = process.argv.includes("--dry-run");
const APPROVE_AT = 0.85;

const supabase = serviceClient();
const dir = resolve("data/verify/verdicts");
const verdicts = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

// Fetch current rows (need existing content to merge, sign_id to update).
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, content");
if (error) {
  console.error(error.message);
  process.exit(1);
}
const byCode = new Map(rows.map((r) => [r.code, r]));

const now = new Date().toISOString();
const updates = [];
const stats = { assetApproved: 0, reviewApproved: 0, exceptions: 0, orphan: 0 };

for (const v of verdicts) {
  const row = byCode.get(v.code);
  if (!row) {
    stats.orphan++;
    console.warn(`  ! verdict for unknown code ${v.code}`);
    continue;
  }

  const assetOk =
    v.match && v.visionPass && v.semanticPass && v.confidence >= APPROVE_AT;
  const reviewOk = assetOk && v.contentPass === true;

  const verification = {
    confidence: v.confidence,
    reason: v.reason,
    visionPass: v.visionPass,
    semanticPass: v.semanticPass,
    match: v.match,
    contentPass: v.contentPass === true,
    suggestedName: v.suggestedName ?? null,
    foundOnChart: v.foundOnChart ?? null,
  };

  const patch = { verification };

  if (assetOk) {
    stats.assetApproved++;
    // Merge English drafts into the bilingual content jsonb (keep any af text).
    patch.content = mergeContentEn(row.content, v.contentDraft);
    patch.asset_status = "approved";
    patch.svg_hash = v.svgHash ?? null;
    patch.approved_by = "ai:claude-code";
    patch.verified_at = now;
    if (reviewOk) {
      patch.review_status = "approved";
      stats.reviewApproved++;
    }
  } else {
    stats.exceptions++;
  }

  updates.push({ sign_id: row.sign_id, code: v.code, patch });
}

console.log(
  `Verdicts: ${verdicts.length} | asset-approve: ${stats.assetApproved} | ` +
    `review-approve: ${stats.reviewApproved} | exceptions (human queue): ${stats.exceptions}` +
    (stats.orphan ? ` | orphan verdicts: ${stats.orphan}` : ""),
);

if (DRY) {
  console.log("\n--dry-run: no writes.");
  process.exit(0);
}

let ok = 0;
for (let i = 0; i < updates.length; i += 25) {
  const batch = updates.slice(i, i + 25);
  const results = await Promise.all(
    batch.map(({ sign_id, patch }) =>
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
console.log(`Wrote ${ok} signs.`);
