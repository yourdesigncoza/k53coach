#!/usr/bin/env node
/**
 * Step 2 of the road-sign pipeline (see docs/road-sign-assets.md).
 *
 * For each sign in data/signs-from-pdf.json, searches Wikimedia Commons for the
 * matching SVG, records its PER-FILE licence (Commons licences are per file —
 * never assumed), downloads the SVG to public/signs/, and writes a merged
 * catalog with provenance to data/signs-catalog.json.
 *
 * Politeness: identifies via User-Agent, runs sequentially with a small delay.
 *
 * Usage:
 *   node scripts/signs/fetch-wikimedia.mjs [--limit N] [--offset N]
 *        [--filter regulatory|warning|marking] [--force] [--dry-run]
 *
 * Nothing here auto-approves anything: every asset lands as
 * assetStatus "needs_review" for human licence + chart verification.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
const UA =
  "K53AICoach-SignImporter/0.1 (educational; contact: dev@k53coach.local)";
const SIGNS_DIR = resolve("public/signs");
const IN = resolve("data/signs-from-pdf.json");
const OUT = resolve("data/signs-catalog.json");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIMIT = Number(val("limit", "0")) || Infinity;
const OFFSET = Number(val("offset", "0"));
const FILTER = val("filter", null);
const FORCE = flag("force");
const DRY = flag("dry-run");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

/** Try filename-based queries first (Commons names SADC signs by code). */
function queriesFor(sign) {
  const q = [`SADC road sign ${sign.code}`];
  if (sign.name) q.push(`South Africa road sign ${sign.name}`);
  q.push(`South African road sign ${sign.code}`);
  return q;
}

async function findFile(sign) {
  for (const srsearch of queriesFor(sign)) {
    const data = await api({
      action: "query",
      list: "search",
      srsearch: `${srsearch} filetype:bitmap|drawing`,
      srnamespace: "6",
      srlimit: "5",
    });
    const hits = data?.query?.search ?? [];
    const svg = hits.find((h) => /\.svg$/i.test(h.title));
    if (svg) return { title: svg.title, matchedQuery: srsearch };
  }
  return null;
}

async function imageInfo(title) {
  const data = await api({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
  });
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0] ?? null;
}

function provenanceFrom(title, info, matchedQuery) {
  const m = info?.extmetadata ?? {};
  const pick = (k) => m[k]?.value?.replace(/<[^>]+>/g, "").trim() || null;
  const licence = pick("LicenseShortName") || pick("UsageTerms") || "UNKNOWN";
  const attribution =
    (pick("AttributionRequired") || "").toLowerCase() === "true";
  return {
    source: "Wikimedia Commons",
    sourceUrl: info?.descriptionshorturl || info?.descriptionurl || null,
    fileTitle: title,
    matchedQuery,
    licence,
    licenceUrl: pick("LicenseUrl"),
    artist: pick("Artist"),
    attributionRequired: attribution,
    verifiedAgainst: "RTSigns_charts.pdf",
    assetStatus: "needs_review",
  };
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function main() {
  const all = JSON.parse(readFileSync(IN, "utf8"));
  const queue = all
    .filter((s) => (FILTER ? s.category === FILTER : true))
    .slice(OFFSET, OFFSET === 0 && LIMIT === Infinity ? undefined : OFFSET + LIMIT);

  if (!DRY) mkdirSync(SIGNS_DIR, { recursive: true });

  const catalog = [];
  let ok = 0;
  let miss = 0;

  for (const sign of queue) {
    const fileName = `${sign.code.replace(/[^\w.-]/g, "_")}.svg`;
    const dest = resolve(SIGNS_DIR, fileName);
    try {
      const hit = await findFile(sign);
      if (!hit) {
        miss++;
        catalog.push({ ...sign, provenance: null, status: "no-match" });
        console.log(`✗ ${sign.code.padEnd(7)} no match`);
        await sleep(200);
        continue;
      }
      const info = await imageInfo(hit.title);
      const provenance = provenanceFrom(hit.title, info, hit.matchedQuery);

      if (!DRY && info?.url && (FORCE || !existsSync(dest))) {
        await download(info.url, dest);
      }
      provenance.svgFile = `signs/${fileName}`;
      catalog.push({ ...sign, provenance, status: "matched" });
      ok++;
      console.log(`✓ ${sign.code.padEnd(7)} ${hit.title}  [${provenance.licence}]`);
    } catch (err) {
      miss++;
      catalog.push({ ...sign, provenance: null, status: `error: ${err.message}` });
      console.log(`! ${sign.code.padEnd(7)} ${err.message}`);
    }
    await sleep(250); // be polite to Commons
  }

  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`\nMatched ${ok}, missed ${miss}. → ${OUT}`);
  console.log(
    "Every record is assetStatus=needs_review. Licence-audit each file before use.",
  );
}

main();
