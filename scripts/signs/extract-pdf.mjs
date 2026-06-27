#!/usr/bin/env node
/**
 * Step 1 of the road-sign pipeline (see docs/road-sign-assets.md).
 *
 * Extracts the sign inventory from the official Department of Transport chart
 * (init/RTSigns_charts.pdf) into data/signs-from-pdf.json.
 *
 * The chart sheets list sign CODES grouped under category headers; later sheets
 * give "CODE Name" description pairs. We merge both: every code we find, tagged
 * with its category, plus a name where the chart provides one.
 *
 * Requires `pdftotext` (poppler-utils) on PATH.
 * Usage: node scripts/signs/extract-pdf.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PDF = resolve("init/RTSigns_charts.pdf");
const OUT = resolve("data/signs-from-pdf.json");

/** Collapse FreeHand letter-spacing ("T E M P O R A R Y" -> "TEMPORARY"). */
function despace(s) {
  return s.replace(/(?<=\b\w) (?=\w\b)/g, "").replace(/\s+/g, " ").trim();
}

/** Map a chart header to our SignCategory + permanent/temporary flag. */
function classify(header) {
  const h = despace(header).toUpperCase();
  const temporary = h.includes("TEMPORARY");
  let category = null;
  if (h.includes("REGULATORY")) category = "regulatory";
  else if (h.includes("WARNING")) category = "warning";
  else if (h.includes("INFORMATION")) category = "guidance";
  else if (h.includes("GUIDANCE")) category = "guidance";
  else if (h.includes("ROAD MARKING")) category = "marking";
  else if (h.includes("COMBINATION")) category = "guidance";
  else if (h.includes("SIGNAL")) category = "regulatory";
  else if (h.includes("VARIABLE MESSAGE")) category = "guidance";
  return category ? { category, temporary } : null;
}

const CODE_RE = /^(T?[RWG]M?\d+(?:\.\d+)*)$/; // R1, R4.1, W308, TW343, WM5, GM1...
const HEADER_RE = /^[A-Z][A-Z0-9 /“”"’'.-]{3,}$/;
const NAMED_RE = /^(T?[RWG]M?\d+(?:\.\d+)*)\s+(.{3,}?)\s*$/; // "W308 Children sign"

function normaliseCode(line) {
  const compact = line.replace(/\s+/g, "");
  return CODE_RE.test(compact) ? compact : null;
}

function main() {
  // No -layout: the chart renders one code per line, which is what we want.
  const raw = execFileSync("pdftotext", [PDF, "-"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

  const lines = raw.split(/\r?\n/);
  const names = new Map(); // code -> name
  const found = new Map(); // code -> { category, temporary, subcategory }
  let current = null;
  let subcategory = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // "CODE Name sign" description rows (capture names from any sheet).
    const named = line.match(NAMED_RE);
    if (named) {
      const code = named[1].replace(/\s+/g, "");
      const name = despace(named[2]).replace(/\s*sign$/i, "").trim();
      if (name && !names.has(code)) names.set(code, name);
    }

    // Category header?
    if (HEADER_RE.test(despace(line)) && despace(line).length > 4) {
      const cls = classify(line);
      if (cls) {
        current = cls;
        subcategory = null;
        continue;
      }
    }

    // Bare code token?
    const code = normaliseCode(line);
    if (code) {
      if (current && !found.has(code)) {
        found.set(code, { ...current, subcategory });
      }
      continue;
    }

    // Otherwise a Title-case short line is likely a subcategory label.
    const d = despace(line);
    if (current && d.length <= 28 && /^[A-Z][a-z]/.test(d)) {
      subcategory = d;
    }
  }

  const catalog = [...found.entries()]
    .map(([code, meta]) => ({
      code,
      name: names.get(code) ?? null,
      category: meta.category,
      subcategory: meta.subcategory,
      temporary: meta.temporary,
    }))
    .sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

  mkdirSync(resolve("data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");

  const named = catalog.filter((c) => c.name).length;
  console.log(`Extracted ${catalog.length} sign codes (${named} with names).`);
  console.log(`→ ${OUT}`);
}

main();
