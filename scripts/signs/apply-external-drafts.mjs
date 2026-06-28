#!/usr/bin/env node
/**
 * External-content drafting (close the not-in-chart gap — docs/sign-pipeline-handoff.md §3).
 *
 * For SA signs that are NOT bare codes in the official chart (so the chart-vision
 * gate can't verify them), this expands the DRY family templates in
 * data/external-families.json into per-sign learner content grounded in primary
 * official sources (SARTSM / NATIS), and stages them for the two automated
 * PRE-serve gates (external-verify + content-audit). Nothing is served here.
 *
 * Per variant it: validates (no unresolved {tokens}; all 5 fields; code∉-B), emits
 * a diffable data/verify/external-drafts/<code>.json, then patches the DB row:
 *   content.<field>.en (merge, preserve af) | sa_relevant=true |
 *   asset_status='needs_review' | review_status='reviewed' |
 *   approved_by='ai:claude-code+brave' | verified_at |
 *   verification={drafted, family, provenance, primarySource, foundOnChart:false}
 * Optional --set-name overwrites name from nameTemplate.
 *
 * Fails closed: ANY validation error aborts the whole batch before writes.
 * Idempotent. Usage: node scripts/signs/apply-external-drafts.mjs [--dry-run] [--family <id>] [--set-name]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  serviceClient,
  CONTENT_FIELDS,
  mergeContentEn,
  expandTemplate,
} from "./lib.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const SET_NAME = args.includes("--set-name");
const onlyFamily = args.includes("--family")
  ? args[args.indexOf("--family") + 1]
  : null;

const DRAFTS_DIR = resolve("data/verify/external-drafts");
mkdirSync(DRAFTS_DIR, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve("data/external-families.json"), "utf8"));
const families = manifest.families.filter((f) => !onlyFamily || f.id === onlyFamily);
if (!families.length) {
  console.error(onlyFamily ? `No family '${onlyFamily}'` : "No families in manifest");
  process.exit(1);
}

// ---- Expand + validate (fail-closed, before any DB write) -------------------
const drafts = [];
const problems = [];
for (const fam of families) {
  if (!fam.primarySource) problems.push(`${fam.id}: no primarySource`);
  let re;
  try {
    re = new RegExp(fam.match);
  } catch (e) {
    problems.push(`${fam.id}: bad match regex — ${e.message}`);
    continue;
  }
  for (const variant of fam.variants) {
    const code = variant.code;
    const params = { ...variant.params, code };
    if (/-B$/.test(code)) {
      problems.push(`${code}: -B layout duplicate must not be drafted`);
      continue;
    }
    if (!re.test(code)) {
      problems.push(`${code}: does not match family ${fam.id} regex ${fam.match}`);
      continue;
    }
    const contentEn = {};
    try {
      for (const f of CONTENT_FIELDS) {
        const tmpl = variant.overrides?.[f] ?? fam.template[f];
        if (!tmpl) throw new Error(`missing template field '${f}'`);
        const text = expandTemplate(tmpl, params);
        if (!text.trim()) throw new Error(`empty field '${f}'`);
        contentEn[f] = text;
      }
    } catch (e) {
      problems.push(`${code}: ${e.message}`);
      continue;
    }
    drafts.push({
      code,
      family: fam.id,
      name: fam.nameTemplate ? expandTemplate(fam.nameTemplate, params) : null,
      contentDraft: contentEn,
      primarySource: fam.primarySource,
      provenance: { ...fam.provenance, primarySource: fam.primarySource },
    });
  }
}

if (problems.length) {
  console.error(`ABORT — ${problems.length} validation problem(s), no writes:`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`Expanded ${drafts.length} signs across ${families.length} family/ies — all valid.`);

// Emit the diffable provenance artifact per code (always, even on --dry-run).
for (const d of drafts) {
  writeFileSync(resolve(DRAFTS_DIR, `${d.code}.json`), JSON.stringify(d, null, 2) + "\n");
}
console.log(`Wrote diffable drafts → data/verify/external-drafts/`);

// ---- Apply to DB ------------------------------------------------------------
const supabase = serviceClient();
const codes = drafts.map((d) => d.code);
const { data: rows, error } = await supabase
  .from("road_signs")
  .select("sign_id, code, content")
  .in("code", codes);
if (error) {
  console.error(error.message);
  process.exit(1);
}
const byCode = new Map(rows.map((r) => [r.code, r]));
const orphans = codes.filter((c) => !byCode.has(c));
if (orphans.length) console.warn(`  ! ${orphans.length} manifest codes not in DB: ${orphans.join(", ")}`);

const now = new Date().toISOString();
const updates = drafts
  .filter((d) => byCode.has(d.code))
  .map((d) => {
    const row = byCode.get(d.code);
    const patch = {
      content: mergeContentEn(row.content, d.contentDraft),
      sa_relevant: true,
      asset_status: "needs_review",
      review_status: "reviewed",
      approved_by: "ai:claude-code+brave",
      verified_at: now,
      verification: {
        drafted: true,
        family: d.family,
        provenance: d.provenance,
        primarySource: d.primarySource,
        foundOnChart: false,
      },
    };
    if (SET_NAME && d.name) patch.name = d.name;
    return { sign_id: row.sign_id, code: d.code, patch };
  });

console.log(`To apply: ${updates.length} signs (asset=needs_review, review=reviewed, sa_relevant=true).`);
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
console.log(`Wrote ${ok} signs. Next: render-external-manifest.mjs → external-verify → prep-external-audit.`);
