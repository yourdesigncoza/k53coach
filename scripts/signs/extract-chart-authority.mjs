#!/usr/bin/env node
/**
 * Phase 1 of the sign-accuracy pipeline (docs/sign-accuracy-pipeline.md).
 *
 * Builds the GROUND-TRUTH authority from the official DoT chart
 * (init/RTSigns_charts.pdf): the canonical code -> {name, category, page} index
 * used to verify every ingested Wikipedia sign.
 *
 * The chart is 6 file pages: sheets 1/2/4 are the visual sign charts (one bare
 * CODE per line under category headers — this is where the artwork lives);
 * sheet 5 is the description list ("CODE Name sign" rows, sometimes one name
 * shared across several codes). We harvest:
 *   - category + artwork page  from the chart sheets (bare-code lines)
 *   - name                     from the description rows
 *
 * Output: data/chart-authority.json  [{code, name, category, page}]
 *   page = the file page (1-based, matches pdftoppm output) showing the artwork,
 *          falling back to the page the name was found on.
 *
 * Requires `pdftotext` (poppler) on PATH. Usage: node scripts/signs/extract-chart-authority.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PDF = resolve("init/RTSigns_charts.pdf");
const OUT = resolve("data/chart-authority.json");

/** Collapse FreeHand letter-spacing ("M i n i m u m" -> "Minimum"). */
function despace(s) {
  return s.replace(/(?<=\b\w) (?=\w\b)/g, "").replace(/\s+/g, " ").trim();
}

/** Map a chart header to our SignCategory. */
function classify(header) {
  const h = despace(header).toUpperCase();
  if (h.includes("REGULATORY")) return "regulatory";
  if (h.includes("WARNING")) return "warning";
  if (h.includes("INFORMATION")) return "guidance";
  if (h.includes("GUIDANCE")) return "guidance";
  if (h.includes("ROAD MARKING")) return "marking";
  if (h.includes("COMBINATION")) return "guidance";
  if (h.includes("SIGNAL")) return "regulatory";
  if (h.includes("VARIABLE MESSAGE")) return "guidance";
  return null;
}

const CODE_TOKEN = "(?:T?[RWG]M?|IN)\\d+(?:\\.\\d+)*";
const CODE_RE = new RegExp(`^(${CODE_TOKEN})$`); // bare code on its own line
const HEADER_RE = /^[A-Z][A-Z0-9 /“”"’'.-]{3,}$/;
const NAMED_RE = new RegExp(`^(${CODE_TOKEN})\\s+(.{3,}?)\\s*$`); // "R101 Minimum Speed sign"
// "R112, R113, R114 & R115" — several codes that share the next line's name.
const MULTI_CODE_RE = new RegExp(
  `^(?:${CODE_TOKEN})(?:\\s*[,&]\\s*(?:${CODE_TOKEN}))+$`,
);
const CODE_G = new RegExp(CODE_TOKEN, "g");

function cleanName(raw) {
  return despace(raw)
    .replace(/\s*sign$/i, "")
    .trim();
}

function main() {
  const raw = execFileSync("pdftotext", [PDF, "-"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const pages = raw.split("\f");

  const category = new Map(); // code -> category
  const artworkPage = new Map(); // code -> page (chart sheet)
  const name = new Map(); // code -> name
  const namePage = new Map(); // code -> page where the name was found

  // Names come ONLY from the description sheets (the dedicated "CODE Name sign"
  // pages, identified by having many such rows). Harvesting names off the visual
  // chart sheets bleeds garbage ("- 502", "+IN11.3") from adjacent glyph labels.
  const NAMED_RE_TEST = (ds) => NAMED_RE.test(ds) && !CODE_RE.test(ds);
  const descriptionPages = new Set(
    pages
      .map((p, i) => [
        i + 1,
        p.split(/\r?\n/).map((l) => despace(l.trim())).filter(NAMED_RE_TEST)
          .length,
      ])
      .filter(([, n]) => n >= 10)
      .map(([no]) => no),
  );

  pages.forEach((pageText, idx) => {
    const pageNo = idx + 1;
    const isDescription = descriptionPages.has(pageNo);
    const lines = pageText.split(/\r?\n/);
    let current = null; // current category header on this page
    let pendingCodes = null; // codes awaiting a shared name on the next line

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // A multi-code row: capture its codes, the name is on the following line.
      const ds = despace(line);
      if (isDescription && MULTI_CODE_RE.test(ds)) {
        pendingCodes = ds.match(CODE_G) ?? [];
        continue;
      }
      // Resolve a pending shared name (the line right after a multi-code row).
      if (pendingCodes && !CODE_RE.test(ds) && !HEADER_RE.test(ds)) {
        const shared = cleanName(line);
        if (shared) {
          for (const c of pendingCodes) {
            if (!name.has(c)) {
              name.set(c, shared);
              namePage.set(c, pageNo);
            }
          }
        }
        pendingCodes = null;
        // fall through: this line is only a name, nothing else to do
        continue;
      }
      pendingCodes = null;

      // "CODE Name sign" description row (description sheets only).
      const named = isDescription ? ds.match(NAMED_RE) : null;
      if (named && !CODE_RE.test(ds)) {
        const code = named[1];
        const nm = cleanName(named[2]);
        if (nm && !name.has(code)) {
          name.set(code, nm);
          namePage.set(code, pageNo);
        }
        continue;
      }

      // Category header?
      if (HEADER_RE.test(ds) && ds.length > 4) {
        const cls = classify(line);
        if (cls) {
          current = cls;
          continue;
        }
      }

      // Bare code on the visual chart sheet -> artwork location + category.
      if (CODE_RE.test(ds)) {
        const code = ds;
        if (!artworkPage.has(code)) artworkPage.set(code, pageNo);
        if (current && !category.has(code)) category.set(code, current);
      }
    }
  });

  // IN11.568 / IN11.577 are real IN11.500-series symbolic supplementary plates
  // (INS-568 = goods vehicle, INS-577 = police vehicle) per SARTSM V4C9 — kept.
  const codes = new Set([
    ...category.keys(),
    ...artworkPage.keys(),
    ...name.keys(),
  ]);

  const authority = [...codes]
    .map((code) => ({
      code,
      name: name.get(code) ?? null,
      category: category.get(code) ?? null,
      page: artworkPage.get(code) ?? namePage.get(code) ?? null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

  mkdirSync(resolve("data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(authority, null, 2) + "\n");

  const named = authority.filter((c) => c.name).length;
  const paged = authority.filter((c) => c.page).length;
  console.log(
    `Chart authority: ${authority.length} codes (${named} named, ${paged} with a page).`,
  );
  console.log(`→ ${OUT}`);
}

main();
