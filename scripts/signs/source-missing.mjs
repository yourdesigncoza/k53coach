#!/usr/bin/env node
/**
 * Targeted sourcing for chart signs the gallery-based ingest missed (see the
 * 2026-06-28 coverage finding in docs/sign-pipeline-handoff.md). Unlike
 * ingest-wikipedia.mjs (which rebuilds the whole catalog from the Wikipedia
 * SADC galleries), this fetches a hand-picked set of Commons files by exact
 * title, audits each licence, downloads the SVG, and MERGES new entries into
 * data/signs-catalog.json (never clobbering existing rows).
 *
 * Each sign lands assetStatus=needs_review — run seed-db.mjs afterwards to push
 * them into road_signs, where they appear in the admin exceptions queue for the
 * normal chart-verification before they can ever serve.
 *
 * Usage: node scripts/signs/source-missing.mjs [--dry-run]
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const UA = "K53AICoach-SignImporter/0.2 (educational; dev@k53coach.local)";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const OUT = resolve("data/signs-catalog.json");
const DRY = process.argv.includes("--dry-run");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// The 6 cleanly-available signs (single canonical PD file on Commons). Names are
// conservative; chart-verification + admin review refine them before serving.
const TARGETS = [
  { code: "W346", name: "Emergency flashing light", category: "warning", subcategory: "Warning signs" },
  { code: "IN19", name: "Modal transfer", category: "guidance", subcategory: "Information signs" },
  { code: "IN11.1", name: "Supplementary direction/distance plate (IN11.1)", category: "guidance", subcategory: "Information signs" },
  { code: "IN11.2", name: "Supplementary direction/distance plate (IN11.2)", category: "guidance", subcategory: "Information signs" },
  { code: "IN11.3", name: "Supplementary direction/distance plate (IN11.3)", category: "guidance", subcategory: "Information signs" },
  { code: "IN11.4", name: "Supplementary direction/distance plate (IN11.4)", category: "guidance", subcategory: "Information signs" },
];

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function download(commonsFile, dest) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFile)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const catalog = JSON.parse(readFileSync(OUT, "utf8"));
const have = new Set(catalog.map((c) => c.code));

const titles = TARGETS.map((t) => `File:SADC road sign ${t.code}.svg`).join("|");
const meta = await getJson(
  `${COMMONS}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(titles)}`,
);
const pages = meta?.query?.pages ?? {};
const byTitle = new Map(Object.values(pages).map((p) => [p.title, p]));

let added = 0;
for (const t of TARGETS) {
  if (have.has(t.code)) {
    console.log(`· ${t.code} already in catalog, skipping`);
    continue;
  }
  const commonsFile = `SADC road sign ${t.code}.svg`;
  const page = byTitle.get(`File:${commonsFile}`);
  if (!page || "missing" in page) {
    console.log(`✗ ${t.code} not on Commons, skipping`);
    continue;
  }
  const info = page.imageinfo?.[0] ?? {};
  const m = info.extmetadata ?? {};
  const fileName = `${t.code.replace(/[^\w.-]/g, "_")}.svg`;
  const dest = resolve("public/signs", fileName);
  try {
    if (!DRY) {
      await download(commonsFile, dest);
      await sleep(150);
    }
    catalog.push({
      code: t.code,
      name: t.name,
      category: t.category,
      subcategory: t.subcategory,
      temporary: false,
      inOfficialChart: true,
      provenance: {
        svgFile: `signs/${fileName}`,
        source: "Wikimedia Commons (SADC)",
        commonsFile,
        sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsFile)}`,
        licence: strip(m.LicenseShortName?.value) || "UNKNOWN",
        artist: strip(m.Artist?.value) || null,
        attributionRequired: (m.AttributionRequired?.value || "").toLowerCase() === "true",
        verifiedAgainst: "RTSigns_charts.pdf",
        assetStatus: "needs_review",
      },
    });
    added++;
    console.log(`✓ ${t.code.padEnd(8)} ${strip(m.LicenseShortName?.value) || "?"}  -> public/signs/${fileName}`);
  } catch (err) {
    console.log(`✗ ${t.code.padEnd(8)} ${err.message}`);
  }
}

if (!DRY) {
  catalog.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
}
console.log(`\n${DRY ? "[dry-run] would add" : "Added"} ${added} sign(s). Catalog now ${catalog.length}.`);
console.log("Next: node scripts/signs/seed-db.mjs  (inserts as needs_review)");
