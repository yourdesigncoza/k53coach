#!/usr/bin/env node
/**
 * Cohort-aware render for the external (not-in-chart) drafting pipeline.
 *
 * Separate from build-verify-manifest.mjs ON PURPOSE: that one filters
 * `.neq("alignment","not_in_chart")`, which excludes this entire cohort. Here we
 * select the drafted external cohort (approved_by='ai:claude-code+brave', still
 * review_status='reviewed' = not yet served), rasterise each SVG → PNG, and emit
 * a manifest the external-verify pass consumes. There is NO chart page to compare
 * against — verification is against each sign's primary official source instead.
 *
 * Output: data/verify/external-png/<code>.png + data/verify/external-manifest.json
 *   [{code, name, category, family, primarySource, sources[], svgPngPath, svgHash}]
 * Usage: node scripts/signs/render-external-manifest.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { serviceClient } from "./lib.mjs";

const PNG_DIR = resolve("data/verify/external-png");
const OUT = resolve("data/verify/external-manifest.json");
mkdirSync(PNG_DIR, { recursive: true });

const supabase = serviceClient();
const { data: signs, error } = await supabase
  .from("road_signs")
  .select("code, name, category, svg_file, verification")
  .eq("approved_by", "ai:claude-code+brave")
  .eq("review_status", "reviewed")
  .order("code");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const manifest = [];
let rendered = 0;
const problems = [];

for (const s of signs) {
  if (!s.svg_file) { problems.push(`${s.code}: no svg_file`); continue; }
  const svgPath = resolve("public", s.svg_file);
  if (!existsSync(svgPath)) { problems.push(`${s.code}: missing ${s.svg_file}`); continue; }
  const svg = readFileSync(svgPath);
  const svgHash = createHash("sha256").update(svg).digest("hex");
  const pngPath = resolve(PNG_DIR, `${s.code}.png`);
  try {
    const png = new Resvg(svg.toString("utf8"), {
      fitTo: { mode: "width", value: 512 },
      background: "white",
    }).render().asPng();
    writeFileSync(pngPath, png);
    rendered++;
  } catch (e) {
    problems.push(`${s.code}: render failed — ${e.message}`);
    continue;
  }
  const v = s.verification ?? {};
  manifest.push({
    code: s.code,
    name: s.name,
    category: s.category,
    family: v.family ?? null,
    primarySource: v.primarySource ?? null,
    sources: v.provenance?.urls ?? [],
    sourceExcerpts: v.provenance?.snippetExcerpts ?? [],
    svgPngPath: pngPath,
    svgHash,
  });
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Rendered ${rendered} sign PNGs → data/verify/external-png/`);
console.log(`External manifest: ${manifest.length} signs → ${OUT}`);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log("  " + p);
}
