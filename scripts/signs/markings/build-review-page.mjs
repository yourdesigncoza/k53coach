#!/usr/bin/env node
/**
 * Build a visual review page for the 16 road markings.
 *
 * Puts three things next to each other for every marking:
 *   official   — vector pulled straight out of the DoT chart (extract-official-svg.mjs)
 *   client     — Louwrens' batch after cleaning + cropping (clean-, crop-client-svg.mjs)
 *   notes      — what is wrong with the client version, and the SARTSM cite
 *
 * Open the output in a browser. Nothing here writes to the database or the app.
 *
 *   node scripts/signs/markings/build-review-page.mjs && xdg-open docs/markings-review.html
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const OFFICIAL = join(HERE, 'official-svg')
const CLIENT = join(HERE, 'client-svg-cleaned')
const OUT = join(ROOT, 'docs', 'markings-review.html')

/** verdict: ok | fix | redraw — drives the badge colour. */
const MARKINGS = [
  { code: 'RTM1', name: 'Stop line', cite: '§7.2.1', verdict: 'ok',
    note: 'Client version is sound. STOP lettering is paint, not a caption — keep it, but convert to a path so it does not depend on a font.' },
  { code: 'RTM2', name: 'Yield line', cite: '§7.2.2', verdict: 'fix',
    note: 'Client draws a YIELD word on the road. The chart shows a triangle marking, not lettering — check before keeping the word.' },
  { code: 'RTM3', name: 'Pedestrian crossing lines', cite: '§7.2.3', verdict: 'ok',
    note: 'Client version is sound, no text.' },
  { code: 'RTM4', name: 'Block pedestrian crossing', cite: '§7.2.4', verdict: 'ok',
    note: 'Client version is sound.' },
  { code: 'RM1', name: 'No overtaking line', cite: '§7.2.5', verdict: 'ok',
    note: 'Single continuous white centre line. Captions have been stripped.' },
  { code: 'RM2', name: 'No crossing lines', cite: '§7.2.6', verdict: 'ok',
    note: 'Two continuous parallel white lines.' },
  { code: 'RM4.1', name: 'Left edge line', cite: '§7.2.8', verdict: 'fix',
    note: 'Client draws yellow edge lines on BOTH edges. RM4.1 is the left edge line — the sunrise-to-sunset / 150 m / being-overtaken rule is a left-edge rule, and a symmetrical picture muddies it.' },
  { code: 'RM5', name: 'Painted island', cite: '§7.2.9', verdict: 'fix',
    note: 'Client <desc> claims yellow diagonal bars but the file has no yellow fill. Compare against the chart.' },
  { code: 'RM6', name: 'Parking bays', cite: '§7.2.10', verdict: 'ok',
    note: 'White T-shaped bay markings.' },
  { code: 'RM7', name: 'Exclusive parking bay', cite: '§7.2.11', verdict: 'ok',
    note: 'Yellow three-sided bay + oval RM7.1 with designatory letter. The chart confirms the full legend, including R = Rickshaw, which we had down as unverified — Louwrens was right.' },
  { code: 'RM8', name: 'Mandatory direction arrows', cite: '§7.2.12', verdict: 'ok',
    note: 'Arrows correctly yellow — the client fixed this from the earlier batch. Client shows six variants; the chart shows the set in one vignette.' },
  { code: 'RM9', name: 'Exclusive use lane line', cite: '§7.2.13', verdict: 'fix',
    note: 'Client draws solid yellow left + broken yellow right + the word BUS. RM9 is the broken yellow line; the word is RM17 (§7.2.21). The solid line is not RM9.' },
  { code: 'RM10', name: 'Box junction', cite: '§7.2.14', verdict: 'fix',
    note: 'Yellow cross-hatch is right, but the client has painted STOP on two approaches, which is not part of a box junction.' },
  { code: 'RM12', name: 'No stopping line', cite: '§7.2.16', verdict: 'ok',
    note: 'CORRECTION (30 Jul): the two-panel drawing is RIGHT and we were wrong to reject it. §7.2.16(2) defines BOTH a continuous solid red line (24-hour, min 150 mm) AND a broken red line (limited periods, min 100 mm) whose times come from an accompanying sign. The chart vignettes are labelled "24 hours" and "Selective periods". The client drew this correctly.' },
  { code: 'RM13', name: 'No parking line', cite: '§7.2.17', verdict: 'ok',
    note: 'Same correction as RM12. §7.2.17(2) defines a continuous solid yellow line (24-hour, min 100 mm) and a broken yellow line (limited periods, min 100 mm). The client was right.' },
  { code: 'RM15', name: 'Traffic circle direction arrows', cite: '§7.2.19', verdict: 'redraw',
    note: 'Client version is a hand-traced copy of the picture rejected on 28 July: grass and paving patterns, a landscaped raised island, no yellow arrows, no painted circle. Use the official artwork instead.' },
]

const BADGE = {
  ok: ['Client usable', 'ok'],
  fix: ['Needs correction', 'fix'],
  redraw: ['Use official', 'redraw'],
}

const read = (dir, code) => {
  const p = join(dir, `${code}.svg`)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8').replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/, '').trim()
}

const rows = MARKINGS.map((m) => {
  const official = read(OFFICIAL, m.code)
  const client = read(CLIENT, m.code)
  const [badgeText, badgeCls] = BADGE[m.verdict]
  const cell = (svg, missing) => svg
    ? `<div class="art">${svg}</div>`
    : `<div class="art empty">${missing}</div>`
  return `<section class="row" id="${m.code}">
  <header>
    <h2><span class="code">${m.code}</span> ${m.name}</h2>
    <div class="meta"><span class="badge ${badgeCls}">${badgeText}</span><span class="cite">SARTSM Vol 1 ${m.cite}</span></div>
  </header>
  <div class="pair">
    <figure><figcaption>Official — DoT chart</figcaption>${cell(official, 'not extracted')}</figure>
    <figure><figcaption>Client — cleaned &amp; cropped</figcaption>${cell(client, 'none supplied')}</figure>
  </div>
  <p class="note">${m.note}</p>
</section>`
}).join('\n')

const counts = MARKINGS.reduce((a, m) => ({ ...a, [m.verdict]: (a[m.verdict] || 0) + 1 }), {})

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>K53 — road markings artwork review</title>
<style>
  :root{
    --bg:#faf7f2; --panel:#fff; --ink:#221813; --muted:#6b5c52; --line:#e7ded1;
    --gold:#ffc46b; --gold-ink:#8a5a00;
    --ok:#2f7d51; --ok-bg:#e8f5ed; --fix:#9a6800; --fix-bg:#fdf3dd; --redraw:#a52f2f; --redraw-bg:#fbeaea;
  }
  @media (prefers-color-scheme:dark){
    :root{ --bg:#181110; --panel:#241a16; --ink:#f3e9df; --muted:#b3a196; --line:#3b2a22;
           --ok-bg:#14301f; --fix-bg:#332708; --redraw-bg:#361616; --ok:#7fd0a0; --fix:#e8bd58; --redraw:#f08f8f; }
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
       font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       padding:24px 16px 80px}
  .wrap{max-width:1040px;margin:0 auto}
  h1{font-size:24px;margin:0 0 4px}
  .sub{color:var(--muted);margin:0 0 20px;max-width:70ch}
  .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;
       position:sticky;top:0;z-index:5;padding:12px 0;background:var(--bg);border-bottom:1px solid var(--line);margin-bottom:20px}
  button{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--ink);
         padding:6px 12px;border-radius:999px}
  button[aria-pressed="true"]{background:var(--gold);border-color:var(--gold);color:#3b2a22;font-weight:600}
  .tally{margin-left:auto;color:var(--muted);font-size:13px}
  .row{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}
  .row header{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;justify-content:space-between;margin-bottom:12px}
  h2{font-size:17px;margin:0;font-weight:600}
  .code{display:inline-block;min-width:3.6em;font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;
        color:var(--gold-ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:2px 6px;margin-right:6px}
  @media (prefers-color-scheme:dark){ .code{color:var(--gold)} }
  .meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .badge{font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px}
  .badge.ok{color:var(--ok);background:var(--ok-bg)} .badge.fix{color:var(--fix);background:var(--fix-bg)}
  .badge.redraw{color:var(--redraw);background:var(--redraw-bg)}
  .cite{font-size:12px;color:var(--muted);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media (max-width:640px){ .pair{grid-template-columns:1fr} }
  figure{margin:0}
  figcaption{font-size:12px;color:var(--muted);margin-bottom:6px}
  .art{border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;align-items:center;justify-content:center;
       min-height:190px;overflow:hidden}
  .art svg{width:100%;height:auto;max-height:var(--size,260px);display:block}
  .art.empty{color:var(--muted);font-size:13px;min-height:190px}
  body.checker .art{background-color:#fff;
    background-image:linear-gradient(45deg,#e9e2d6 25%,transparent 25%),linear-gradient(-45deg,#e9e2d6 25%,transparent 25%),
                     linear-gradient(45deg,transparent 75%,#e9e2d6 75%),linear-gradient(-45deg,transparent 75%,#e9e2d6 75%);
    background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}
  body.small{--size:74px}
  body.small .art{min-height:96px}
  .note{margin:12px 0 0;color:var(--muted);font-size:13.5px;max-width:88ch}
  footer{color:var(--muted);font-size:12.5px;margin-top:28px;border-top:1px solid var(--line);padding-top:14px;max-width:80ch}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
</style></head>
<body class="checker">
<div class="wrap">
  <h1>Road markings — artwork review</h1>
  <p class="sub">Official artwork extracted from the Department of Transport chart, next to Louwrens' batch after
  automatic cleaning and cropping. Nothing here is in the app; all 16 markings remain
  <code>asset_status='needs_review'</code> and out of the served set.</p>

  <div class="bar">
    <button id="t-checker" aria-pressed="true">Transparency check</button>
    <button id="t-small" aria-pressed="false">Actual app size</button>
    <span class="tally">${counts.ok || 0} client usable · ${counts.fix || 0} need correction · ${counts.redraw || 0} use official</span>
  </div>

${rows}

  <footer>
    <strong>Sources.</strong> Official: <code>resources/charts/RTSigns_charts.pdf</code> sheet 2 of 5 — "ROAD TRAFFIC SIGNS",
    National Department of Transport, 2000 — the same chart the 362 road signs were verified against.
    Extracted as vector by <code>scripts/signs/markings/extract-official-svg.mjs</code>.
    Client: Linear K53-37, 29 July batch, processed by <code>clean-client-svg.mjs</code> then <code>crop-client-svg.mjs</code>.
    Per-marking spec: <code>docs/verification-worklist.md</code> rows 71–84.
    Regenerate this page with <code>node scripts/signs/markings/build-review-page.mjs</code>.
  </footer>
</div>
<script>
  for (const [id, cls] of [['t-checker','checker'],['t-small','small']]) {
    document.getElementById(id).addEventListener('click', (e) => {
      const on = document.body.classList.toggle(cls)
      e.currentTarget.setAttribute('aria-pressed', String(on))
    })
  }
</script>
</body></html>`

writeFileSync(OUT, html)
console.log(`review page -> ${OUT}  (${(html.length / 1024).toFixed(0)} KB, ${MARKINGS.length} markings)`)
