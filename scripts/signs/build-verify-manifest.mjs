#!/usr/bin/env node
/**
 * Phase 3 (step 1) of the sign-accuracy pipeline (docs/sign-accuracy-pipeline.md).
 *
 * Prepares the verification work-list the Claude Code session consumes. For every
 * in-chart sign (alignment != 'not_in_chart') it:
 *   - rasterises public/<svg_file> -> data/verify/png/<code>.png (resvg)
 *   - resolves the chart page PNG (data/chart-pages/page-<N>.png) from chart_match
 *   - records the SVG sha256 (the integrity hash an approval will pin)
 * Output: data/verify/manifest.json  [{code, wikipediaName, category, chartName,
 *   chartPage, svgPngPath, chartPngPath, svgHash}]
 *
 * Prereqs: `data/chart-pages/` rendered (Phase 1), @resvg/resvg-js installed.
 * Usage: node scripts/signs/build-verify-manifest.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { serviceClient } from "./lib.mjs";

const PNG_DIR = resolve("data/verify/png");
const OUT = resolve("data/verify/manifest.json");
mkdirSync(PNG_DIR, { recursive: true });

const supabase = serviceClient();
const { data: signs, error } = await supabase
  .from("road_signs")
  .select("code, name, category, svg_file, chart_match")
  .neq("alignment", "not_in_chart")
  .order("code");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const manifest = [];
let rendered = 0;
const problems = [];

for (const s of signs) {
  if (!s.svg_file) {
    problems.push(`${s.code}: no svg_file`);
    continue;
  }
  const svgPath = resolve("public", s.svg_file);
  if (!existsSync(svgPath)) {
    problems.push(`${s.code}: missing ${s.svg_file}`);
    continue;
  }
  const svg = readFileSync(svgPath);
  const svgHash = createHash("sha256").update(svg).digest("hex");

  const pngPath = resolve(PNG_DIR, `${s.code}.png`);
  try {
    const png = new Resvg(svg.toString("utf8"), {
      fitTo: { mode: "width", value: 512 },
      background: "white",
    })
      .render()
      .asPng();
    writeFileSync(pngPath, png);
    rendered++;
  } catch (e) {
    problems.push(`${s.code}: render failed — ${e.message}`);
    continue;
  }

  const page = s.chart_match?.page ?? null;
  const chartPngPath = page ? resolve("data/chart-pages", `page-${page}.png`) : null;
  manifest.push({
    code: s.code,
    wikipediaName: s.name,
    category: s.category,
    chartName: s.chart_match?.name ?? null,
    chartPage: page,
    svgPngPath: pngPath,
    chartPngPath: chartPngPath && existsSync(chartPngPath) ? chartPngPath : null,
    svgHash,
  });
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Rendered ${rendered} sign PNGs → data/verify/png/`);
console.log(`Manifest: ${manifest.length} signs → ${OUT}`);
const noChartPng = manifest.filter((m) => !m.chartPngPath).length;
if (noChartPng) console.log(`(${noChartPng} without a chart-page image)`);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log("  " + p);
}
