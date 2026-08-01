#!/usr/bin/env node
/**
 * Extract the official road-marking artwork from the Department of Transport chart
 * as individual vector SVGs.
 *
 * `resources/charts/RTSigns_charts.pdf` sheet 2 of 5 ("ROAD TRAFFIC SIGNS", National Department
 * of Transport, 2000) carries a full ROAD MARKINGS section — RTM1-4, RM1-RM17,
 * WM1-WM11, GM1-GM8 — drawn as vector, not scanned. That is the same chart the 362
 * road signs were verified against, so it is already this project's ground truth;
 * this pass turns the marking half of it into assets instead of only a reference.
 *
 * Method: pdftocairo renders the page to one SVG, then headless Chrome measures every
 * element with getBBox() and drops the ones outside each marking's crop box. The result
 * is real vector — the DoT's own paths, not a redrawing.
 *
 * Crop boxes are DERIVED from the chart's own printed labels (`pdftotext -bbox`):
 * each vignette sits directly above its code, so the label gives the horizontal centre
 * and the baseline, and the distance to the neighbouring label bounds the width. Only
 * markings drawn as several vignettes under one label need an override — those are
 * listed in OVERRIDES and are the only hand-tuned numbers in the file.
 *
 *   node scripts/signs/markings/extract-official-svg.mjs [--only RM1,WM3]
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const PDF = join(ROOT, 'resources', 'charts', 'RTSigns_charts.pdf')
const OUT = join(HERE, 'official-svg')
const PAGE = 2

/** Gap left between a crop and its neighbour's, as a fraction of the label spacing. */
const TIGHTEN = 0.92
/** Bounds for a derived width, in points. The neighbour gap is the real limit;
 *  these only catch labels with no neighbour in their row. */
const MIN_W = 60, MAX_W = 260
/** Default vignette height, and the gap between a vignette's foot and its label. */
const DEFAULT_H = 132, LABEL_GAP = 5

/**
 * Markings the chart draws as more than one vignette under a single label, or
 * where the neighbouring label is not a marking code so the spacing cannot bound
 * the crop. `cx` overrides the derived centre, `by` the baseline, `w`/`h` the size.
 */
const OVERRIDES = {
  // Information signs on the same sheet, reachable with --only (see the label
  // filter). They are shorter than a marking vignette, so the default 132pt box
  // pulls in the red/white barrier row printed above them.
  IN1:  { h: 74 },
  IN2:  { h: 74 },
  IN3:  { h: 74 },
  RM2:  { cx: 694, w: 68 },          // sits close to RM3
  RM5:  { cx: 1278, w: 206, h: 148 }, // hatched island + chevron island
  RM7:  { w: 104 },                   // parking-bay symbol legend sits to its right
  RM8:  { w: 186 },                   // six arrow variants in one vignette
  RM12: { w: 172, h: 140 },           // kerb view + in-road view
  RM13: { w: 172, h: 140 },           // kerb view + in-road view
  RM15: { w: 150, h: 150 },
  RM17: { cx: 1388, w: 372 },            // bicycle / BUS / TRAM / wheelchair / diamond
  WM1:  { w: 100 },                      // neighbour oval creeps in at the derived width
  WM10: { w: 100 },
  GM6:  { cx: 545, w: 320 },             // four symbols GM6.1-GM6.4
  // GM8's label is printed beside its bar, not beneath it, so the derived
  // baseline points above the artwork. Its kerbface strip is long and shallow.
  GM8:  { cx: 1330, by: 2262, w: 560, h: 62 },
}

const only = (() => {
  const i = process.argv.indexOf('--only')
  return i > -1 ? new Set(process.argv[i + 1].split(',').map((s) => s.trim())) : null
})()

execFileSync('which', ['pdftocairo'], { stdio: 'pipe' })
const CHROME = ['google-chrome', 'chromium', 'chromium-browser']
  .find((c) => { try { execFileSync('which', [c], { stdio: 'pipe' }); return true } catch { return false } })
if (!CHROME) throw new Error('no headless Chrome found')

// ---- derive crop boxes from the chart's printed labels ----------------------

const bboxXml = execFileSync('pdftotext', ['-f', String(PAGE), '-l', String(PAGE), '-bbox', PDF, '-'], { encoding: 'utf8' })
const labels = [...bboxXml.matchAll(
  /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
  .map((m) => ({ x0: +m[1], y0: +m[2], x1: +m[3], code: m[5] }))
  // Markings by default. With --only, widen to any sign-code-shaped label so the
  // requested codes are found AND their printed neighbours still bound the crop
  // width — sheet 2 carries the information signs alongside the markings.
  .filter((w) =>
    /^(RTM|RM|WM|GM)\d+(\.\d+)?$/.test(w.code) ||
    (only && /^[A-Z]{1,3}\d+(\.\d+)?(-[A-Z0-9]+)?$/.test(w.code)))
  .map((w) => ({ ...w, cx: (w.x0 + w.x1) / 2 }))

if (!labels.length) throw new Error('no marking labels found on the chart page')

// Cluster into printed rows, then let each label's neighbours bound its width.
labels.sort((a, b) => a.y0 - b.y0 || a.cx - b.cx)
const rows = []
for (const l of labels) {
  const row = rows[rows.length - 1]
  if (row && l.y0 - row[row.length - 1].y0 <= 25) row.push(l)
  else rows.push([l])
}

const MARKINGS = []
for (const row of rows) {
  row.sort((a, b) => a.cx - b.cx)
  row.forEach((l, i) => {
    const gaps = [row[i - 1] && l.cx - row[i - 1].cx, row[i + 1] && row[i + 1].cx - l.cx].filter(Boolean)
    const derived = gaps.length ? Math.min(...gaps) * TIGHTEN : MAX_W
    const o = OVERRIDES[l.code] || {}
    MARKINGS.push({
      code: l.code,
      cx: o.cx ?? l.cx,
      by: o.by ?? l.y0 - LABEL_GAP,
      w: o.w ?? Math.min(MAX_W, Math.max(MIN_W, derived)),
      h: o.h ?? DEFAULT_H,
      tuned: Boolean(OVERRIDES[l.code]),
    })
  })
}

const targets = only ? MARKINGS.filter((m) => only.has(m.code)) : MARKINGS
if (!targets.length) throw new Error('--only matched no markings')

// ---- prune the page down to each crop --------------------------------------

const tmp = mkdtempSync(join(tmpdir(), 'dotchart-'))
const pageSvg = join(tmp, 'page.svg')
execFileSync('pdftocairo', ['-svg', '-f', String(PAGE), '-l', String(PAGE), PDF, pageSvg])

const boxes = targets.map((m) => ({ code: m.code, x: m.cx - m.w / 2, y: m.by - m.h, w: m.w, h: m.h }))

const html = `<!doctype html><meta charset="utf-8"><body>
<div id="src">${readFileSync(pageSvg, 'utf8').replace(/<\?xml[^>]*\?>/, '')}</div>
<pre id="out"></pre>
<script>
const boxes = ${JSON.stringify(boxes)};
const src = document.querySelector('#src svg');
const hit = (b, r) => !(r.x + r.width < b.x || r.x > b.x + b.w || r.y + r.height < b.y || r.y > b.y + b.h);
const out = {};
for (const b of boxes) {
  const clone = src.cloneNode(true);
  document.body.appendChild(clone);
  for (const el of [...clone.querySelectorAll('path,use,image,rect,circle,polygon,polyline,line,ellipse')]) {
    let r; try { r = el.getBBox() } catch { continue }
    if (!r.width && !r.height) { el.remove(); continue }
    if (!hit(b, r)) el.remove();
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of [...clone.querySelectorAll('g')]) {
      if (!g.querySelector('path,use,image,rect,circle,polygon,polyline,line,ellipse')) { g.remove(); changed = true }
    }
  }
  // The page carries a <defs> of font glyph outlines for every label on the sheet.
  const referenced = new Set([...clone.querySelectorAll('use')]
    .map((u) => (u.getAttribute('xlink:href') || u.getAttribute('href') || '').replace('#', ''))
    .filter(Boolean));
  for (const def of [...clone.querySelectorAll('defs [id]')]) if (!referenced.has(def.id)) def.remove();
  for (const d of [...clone.querySelectorAll('defs')]) if (!d.children.length) d.remove();

  clone.setAttribute('viewBox', [b.x, b.y, b.w, b.h].join(' '));
  clone.removeAttribute('width'); clone.removeAttribute('height');
  out[b.code] = clone.outerHTML;
  clone.remove();
}
document.getElementById('out').textContent = JSON.stringify(out);
</script>`

const measure = join(tmp, 'extract.html')
writeFileSync(measure, html)
const dom = execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=25000',
  '--dump-dom', `file://${measure}`,
], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 })

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)
if (!m) throw new Error('extraction produced no output')
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
const result = JSON.parse(decode(m[1]))
rmSync(tmp, { recursive: true, force: true })

// ---- tidy and write --------------------------------------------------------

/**
 * pdftocairo emits 6-decimal coordinates, percentage rgb() and explicit
 * opacity="1", and the pruning leaves the whitespace of every element it removed.
 * None of that survives contact with a phone on mobile data.
 */
function tidy(svg) {
  const pct = (v) => Math.round((parseFloat(v) / 100) * 255)
  return svg
    .replace(/rgb\(\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\s*\)/g,
      (_, r, g, b) => '#' + [r, g, b].map((v) => pct(v).toString(16).padStart(2, '0')).join(''))
    .replace(/\s(?:fill|stroke)-opacity="1"/g, '')
    .replace(/(\d+\.\d{3,})/g, (n) => String(Math.round(parseFloat(n) * 100) / 100))
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

mkdirSync(OUT, { recursive: true })
const header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!-- Source: resources/charts/RTSigns_charts.pdf sheet 2/5 — ROAD TRAFFIC SIGNS,\n' +
  '     National Department of Transport, 2000. Official artwork, extracted as vector. -->\n'

let total = 0
for (const t of targets) {
  const raw = result[t.code]
  if (!raw) { console.log(`${t.code.padEnd(7)} MISSING`); continue }
  const svg = tidy(raw)
  writeFileSync(join(OUT, `${t.code}.svg`), header + svg + '\n')
  total += svg.length
  const paths = (svg.match(/<path/g) || []).length
  console.log(
    `${t.code.padEnd(7)} ${String(svg.length).padStart(6)}b ${String(paths).padStart(4)} paths` +
    `  w=${Math.round(t.w)}${t.tuned ? ' (tuned)' : ''}`,
  )
}
console.log(`\n${targets.length} markings, ${(total / 1024).toFixed(0)} KB -> ${OUT}`)
