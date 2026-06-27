#!/usr/bin/env node
/**
 * Road-sign ingest — Wikipedia SADC page as the structured index, the official
 * SA DoT chart (init/RTSigns_charts.pdf) as the authority/verifier.
 *
 * Why this replaces the old search-based fetch: the Wikipedia page gives the
 * EXACT Commons filename + name + category per sign, so downloads are
 * deterministic (no more wrong-variant matches). See docs/road-sign-assets.md.
 *
 * Pipeline: parse wikitext galleries -> reconcile codes against the PDF
 * (inOfficialChart) -> batch licence-audit via Commons API -> download the
 * exact SVGs to public/signs -> write data/signs-catalog.json with provenance.
 *
 * Requires: pdftotext (poppler) + network. Usage:
 *   node scripts/signs/ingest-wikipedia.mjs [--limit N] [--dry-run] [--force]
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PAGE = "Road_signs_in_the_Southern_African_Development_Community";
const UA = "K53AICoach-SignImporter/0.2 (educational; dev@k53coach.local)";
const SIGNS_DIR = resolve("public/signs");
const OUT = resolve("data/signs-catalog.json");
const PDF = resolve("init/RTSigns_charts.pdf");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIMIT = Number(val("limit", "0")) || Infinity;
const DRY = flag("dry-run");
const FORCE = flag("force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

/** Top-level SignCategory from the Wikipedia level-3 section heading. */
function topCategory(h3) {
  const h = h3.toLowerCase();
  if (h.includes("regulatory")) return "regulatory";
  if (h.includes("warning")) return "warning";
  if (h.includes("information")) return "guidance";
  if (h.includes("combo")) return "guidance";
  return "guidance";
}

/** Build a set of sign codes that appear in the official SA DoT chart. */
function pdfCodeSet() {
  const raw = execFileSync("pdftotext", [PDF, "-"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const set = new Set();
  const CODE_RE = /^(T?[RWGI][A-Z]*M?\d+(?:\.\d+)*)$/;
  for (const line of raw.split(/\r?\n/)) {
    const c = line.replace(/\s+/g, "");
    if (CODE_RE.test(c)) set.add(c);
  }
  return set;
}

/** Parse the wikitext into sign records, tracking section headings. */
function parseSigns(wt) {
  const lines = wt.split(/\r?\n/);
  let h2 = "",
    h3 = "",
    h4 = "",
    inGallery = false;
  const seen = new Map();
  const fileRe = /^File:SADC[ _]road[ _]sign[ _](.+?)\.svg\s*(?:\|(.*))?$/i;

  for (const line of lines) {
    const m2 = line.match(/^==\s*([^=].*?)\s*==$/);
    const m3 = line.match(/^===\s*([^=].*?)\s*===$/);
    const m4 = line.match(/^====\s*([^=].*?)\s*====$/);
    if (m4) {
      h4 = m4[1];
      continue;
    }
    if (m3) {
      h3 = m3[1];
      h4 = "";
      continue;
    }
    if (m2) {
      h2 = m2[1];
      h3 = "";
      h4 = "";
      continue;
    }
    if (/<gallery/i.test(line)) inGallery = true;
    if (/<\/gallery>/i.test(line)) inGallery = false;
    if (!inGallery) continue;

    const fm = line.match(fileRe);
    if (!fm) continue;
    const code = fm[1].replace(/\s+/g, "");
    if (seen.has(code)) continue;
    seen.set(code, {
      code,
      name: strip(fm[2]) || code,
      category: topCategory(h3),
      subcategory: h4 || h3 || null,
      temporary: /temporary/i.test(h2),
      commonsFile: `SADC road sign ${code}.svg`,
    });
  }
  return [...seen.values()];
}

/** Batch licence + artist from Commons extmetadata (50 titles per request). */
async function fetchLicences(records) {
  const out = new Map();
  for (let i = 0; i < records.length; i += 50) {
    const batch = records.slice(i, i + 50);
    const titles = batch.map((r) => `File:${r.commonsFile}`).join("|");
    const url = `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(
      titles,
    )}`;
    try {
      const data = await getJson(url);
      const pages = data?.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        const info = page?.imageinfo?.[0];
        const m = info?.extmetadata ?? {};
        out.set(page.title, {
          licence: strip(m.LicenseShortName?.value) || "UNKNOWN",
          artist: strip(m.Artist?.value) || null,
          attributionRequired:
            (m.AttributionRequired?.value || "").toLowerCase() === "true",
          descriptionUrl: info?.descriptionurl || null,
        });
      }
    } catch (err) {
      console.log(`! licence batch ${i} failed: ${err.message}`);
    }
    await sleep(250);
  }
  return out;
}

async function download(commonsFile, dest) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    commonsFile,
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  console.log("→ fetching Wikipedia wikitext…");
  const wt = (
    await getJson(
      `${WIKI_API}?action=parse&page=${PAGE}&prop=wikitext&format=json&formatversion=2`,
    )
  ).parse.wikitext;

  let signs = parseSigns(wt);
  console.log(`→ parsed ${signs.length} signs from the page`);

  const inChart = pdfCodeSet();
  console.log(`→ ${inChart.size} codes found in RTSigns_charts.pdf`);

  if (LIMIT !== Infinity) signs = signs.slice(0, LIMIT);

  console.log("→ licence-auditing via Commons API…");
  const licences = await fetchLicences(signs);

  if (!DRY) mkdirSync(SIGNS_DIR, { recursive: true });

  let ok = 0,
    fail = 0;
  const catalog = [];
  for (const s of signs) {
    const fileName = `${s.code.replace(/[^\w.-]/g, "_")}.svg`;
    const dest = resolve(SIGNS_DIR, fileName);
    const lic = licences.get(`File:${s.commonsFile}`) ?? {};
    try {
      if (!DRY && (FORCE || !existsSync(dest))) {
        await download(s.commonsFile, dest);
        await sleep(120);
      }
      ok++;
      catalog.push({
        code: s.code,
        name: s.name,
        category: s.category,
        subcategory: s.subcategory,
        temporary: s.temporary,
        inOfficialChart: inChart.has(s.code),
        provenance: {
          svgFile: `signs/${fileName}`,
          source: "Wikimedia Commons (SADC)",
          commonsFile: s.commonsFile,
          sourceUrl:
            lic.descriptionUrl ||
            `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(s.commonsFile)}`,
          licence: lic.licence || "UNKNOWN",
          artist: lic.artist || null,
          attributionRequired: lic.attributionRequired ?? false,
          verifiedAgainst: "RTSigns_charts.pdf",
          assetStatus: "needs_review",
        },
      });
    } catch (err) {
      fail++;
      console.log(`✗ ${s.code.padEnd(8)} ${err.message}`);
    }
  }

  mkdirSync(resolve("data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");

  const inChartCount = catalog.filter((c) => c.inOfficialChart).length;
  const licCounts = catalog.reduce((m, c) => {
    m[c.provenance.licence] = (m[c.provenance.licence] || 0) + 1;
    return m;
  }, {});
  console.log(`\nDownloaded ${ok}, failed ${fail}. → ${OUT}`);
  console.log(`In official SA chart: ${inChartCount}/${catalog.length}`);
  console.log("Licences:", licCounts);
  console.log(
    "All assetStatus=needs_review. Licence-audit + chart-verify before shipping.",
  );
}

main();
