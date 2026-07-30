#!/usr/bin/env node
/**
 * Build the human verification worksheet for the road-marking learning objects.
 *
 * The accuracy gate (CLAUDE.md constraint 9) says an AI pass checking AI drafts is
 * circular and worthless, so nothing in this page decides anything. It exists only to
 * make a human pass fast and honest: for each marking it puts our drafted words, the
 * citation we claim they rest on, the official artwork, and the actual printed manual
 * page side by side. A person reads and decides; the page records the decision.
 *
 * Decisions persist to localStorage and export as JSON, which
 * apply-marking-verification.mjs turns into `review_status` + `approved_by` +
 * `verified_at` on the row.
 *
 * Prereqs: manual pages rendered into docs/markings-verify/manual/ (see the README),
 * artwork extracted into public/markings/.
 *
 *   node scripts/signs/markings/build-verify-page.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const ART = join(ROOT, 'public', 'markings')
const OUTDIR = join(ROOT, 'docs', 'markings-verify')
const OUT = join(OUTDIR, 'index.html')

const markings = readdirSync(HERE)
  .filter((f) => f.endsWith('.json') && f !== 'package.json')
  .flatMap((f) => JSON.parse(readFileSync(join(HERE, f), 'utf8')))
  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

const FIELDS = [
  ['plainEnglish', 'Plain English'],
  ['formalMeaning', 'Formal meaning'],
  ['behaviour', 'What the driver must do'],
  ['commonMistake', 'Common mistake'],
  ['testHint', 'Test hint'],
  ['memoryTrick', 'Memory trick'],
]

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const cards = markings.map((m, i) => {
  const art = existsSync(join(ART, `${m.code}.svg`))
    ? readFileSync(join(ART, `${m.code}.svg`), 'utf8').replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/, '').trim()
    : '<p class="muted">no artwork</p>'
  const manual = `manual/${m.code}.png`

  const fields = FIELDS.map(([k, label]) => {
    const v = m.content?.[k]?.en
    if (!v) return ''
    return `<div class="field"><dt>${label}</dt><dd>${esc(v)}</dd></div>`
  }).join('')

  return `<article class="card" id="${m.code}" data-code="${m.code}" data-index="${i}">
  <header>
    <h2><span class="code">${m.code}</span>${esc(m.name)}</h2>
    <span class="state" data-state>undecided</span>
  </header>

  <div class="grid">
    <div class="left">
      <div class="art">${art}</div>
      <dl class="fields">${fields}</dl>
      <div class="cite">
        <dt>Citation claimed</dt><dd>${esc(m.source)}</dd>
        ${m.confidence ? `<dt>Drafting note</dt><dd class="small">${esc(m.confidence)}</dd>` : ''}
      </div>
    </div>
    <div class="right">
      <div class="manual-head">Manual page — read this, not my summary of it
        <a href="${manual}" target="_blank" rel="noopener">open full size ↗</a></div>
      <a href="${manual}" target="_blank" rel="noopener"><img src="${manual}" alt="SARTSM page for ${esc(m.code)}" loading="lazy"></a>
    </div>
  </div>

  <footer>
    <div class="actions">
      <button data-act="approved">Approve</button>
      <button data-act="edit">Needs edit</button>
      <button data-act="rejected">Reject</button>
      <button data-act="clear" class="ghost">Clear</button>
    </div>
    <input type="text" data-note placeholder="Note — what to change, or which paragraph settles it">
  </footer>
</article>`
}).join('\n')

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>K53 — road markings content verification</title>
<style>
  :root{--bg:#faf7f2;--panel:#fff;--ink:#221813;--muted:#6b5c52;--line:#e7ded1;--gold:#ffc46b;--gold-ink:#8a5a00;
        --ok:#2f7d51;--ok-bg:#e8f5ed;--warn:#9a6800;--warn-bg:#fdf3dd;--bad:#a52f2f;--bad-bg:#fbeaea}
  @media (prefers-color-scheme:dark){:root{--bg:#181110;--panel:#241a16;--ink:#f3e9df;--muted:#b3a196;--line:#3b2a22;
        --ok:#7fd0a0;--ok-bg:#14301f;--warn:#e8bd58;--warn-bg:#332708;--bad:#f08f8f;--bad-bg:#361616}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:0 16px 120px}
  .wrap{max-width:1280px;margin:0 auto}
  h1{font-size:23px;margin:22px 0 4px}
  .sub{color:var(--muted);margin:0 0 16px;max-width:78ch}
  .bar{position:sticky;top:0;z-index:9;background:var(--bg);border-bottom:1px solid var(--line);
       padding:12px 0;margin-bottom:18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .progress{flex:1;min-width:180px;height:8px;background:var(--line);border-radius:999px;overflow:hidden}
  .progress i{display:block;height:100%;background:var(--gold);width:0}
  .counts{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
  button{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--ink);padding:7px 14px;border-radius:8px}
  button:hover{border-color:var(--gold)}
  button.ghost{color:var(--muted)}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:18px;scroll-margin-top:70px}
  .card.done-approved{border-color:var(--ok)} .card.done-edit{border-color:var(--warn)} .card.done-rejected{border-color:var(--bad)}
  .card header{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap}
  h2{font-size:17px;margin:0;font-weight:600}
  .code{display:inline-block;font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--gold-ink);
        background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:2px 7px;margin-right:9px}
  @media (prefers-color-scheme:dark){.code{color:var(--gold)}}
  .state{font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--bg);color:var(--muted)}
  .state.approved{background:var(--ok-bg);color:var(--ok)} .state.edit{background:var(--warn-bg);color:var(--warn)}
  .state.rejected{background:var(--bad-bg);color:var(--bad)}
  .grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
  @media (max-width:900px){.grid{grid-template-columns:1fr}}
  .art{border:1px solid var(--line);border-radius:10px;padding:10px;background:#fff;display:flex;justify-content:center;margin-bottom:12px}
  .art svg{max-height:190px;width:auto;max-width:100%}
  dl{margin:0}
  .field{padding:8px 0;border-top:1px solid var(--line)}
  .field:first-child{border-top:0}
  dt{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:3px}
  dd{margin:0}
  .cite{margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:13px}
  .cite dd{margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--muted);word-break:break-word}
  .cite dd.small{font-family:inherit;font-size:12.5px}
  .manual-head{font-size:12px;color:var(--muted);margin-bottom:6px;display:flex;justify-content:space-between;gap:8px}
  .manual-head a{color:var(--gold-ink)} @media (prefers-color-scheme:dark){.manual-head a{color:var(--gold)}}
  .right img{width:100%;border:1px solid var(--line);border-radius:10px;background:#fff}
  .card footer{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .actions{display:flex;gap:8px;flex-wrap:wrap}
  input[type=text]{flex:1;min-width:220px;font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
  .muted{color:var(--muted)}
  footer.page{color:var(--muted);font-size:12.5px;margin-top:24px;border-top:1px solid var(--line);padding-top:14px;max-width:80ch}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
  kbd{font:11px ui-monospace,monospace;border:1px solid var(--line);border-bottom-width:2px;border-radius:4px;padding:1px 5px;background:var(--bg)}
  #out{width:100%;min-height:130px;font:12px ui-monospace,monospace;margin-top:10px;padding:10px;
       border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);display:none}
</style></head>
<body><div class="wrap">
  <h1>Road markings — content verification</h1>
  <p class="sub">Sixteen learning objects, AI-drafted from the manual and never checked by a person. Each card shows
  what we wrote, the citation we claim it rests on, and the actual printed manual page. Read the page, not my summary of
  it. Nothing here decides anything — your decisions are recorded and applied by a separate script.</p>

  <div class="bar">
    <div class="progress"><i id="pbar"></i></div>
    <span class="counts" id="counts"></span>
    <button id="next">Next undecided</button>
    <button id="export">Export decisions</button>
  </div>

  <textarea id="out" readonly spellcheck="false"></textarea>

${cards}

  <footer class="page">
    <strong>Keys.</strong> <kbd>a</kbd> approve · <kbd>e</kbd> needs edit · <kbd>r</kbd> reject · <kbd>j</kbd>/<kbd>k</kbd> next/previous ·
    the card under the cursor is the one that acts.<br>
    <strong>Sources.</strong> Manual pages: <code>init/V1C7.pdf</code> — SADC RTSM Vol 1 Ch 7, Road Markings (May 2012).
    Artwork: <code>init/RTSigns_charts.pdf</code> sheet 2 of 5, National Department of Transport, 2000.
    Drafts: <code>scripts/signs/markings/*.json</code>.<br>
    <strong>Applying.</strong> Export, save as <code>docs/markings-verify/decisions.json</code>, then
    <code>node scripts/signs/markings/apply-marking-verification.mjs --by "your name"</code>.
    Only <em>approved</em> rows move <code>review_status</code>; anything else stays draft and out of the served set.
  </footer>
</div>
<script>
const KEY = 'k53-marking-verify'
const cards = [...document.querySelectorAll('.card')]
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
let state = load()

function paint() {
  let n = 0
  for (const c of cards) {
    const s = state[c.dataset.code]
    c.classList.remove('done-approved', 'done-edit', 'done-rejected')
    const badge = c.querySelector('[data-state]')
    const note = c.querySelector('[data-note]')
    if (s && s.decision) {
      n++
      c.classList.add('done-' + s.decision)
      badge.textContent = s.decision
      badge.className = 'state ' + s.decision
      if (note && document.activeElement !== note) note.value = s.note || ''
    } else {
      badge.textContent = 'undecided'
      badge.className = 'state'
    }
  }
  document.getElementById('pbar').style.width = (n / cards.length * 100) + '%'
  const tally = (d) => Object.values(state).filter((s) => s.decision === d).length
  document.getElementById('counts').textContent =
    n + ' of ' + cards.length + ' decided — ' + tally('approved') + ' approved, ' +
    tally('edit') + ' need edit, ' + tally('rejected') + ' rejected'
}

function set(code, decision) {
  const cur = state[code] || {}
  if (decision === 'clear') delete state[code]
  else state[code] = { decision, note: cur.note || '' }
  localStorage.setItem(KEY, JSON.stringify(state))
  paint()
}

for (const c of cards) {
  c.querySelector('.actions').addEventListener('click', (e) => {
    const act = e.target.dataset.act
    if (act) set(c.dataset.code, act)
  })
  c.querySelector('[data-note]').addEventListener('input', (e) => {
    const cur = state[c.dataset.code] || { decision: '' }
    state[c.dataset.code] = { ...cur, note: e.target.value }
    localStorage.setItem(KEY, JSON.stringify(state))
  })
}

const cardUnderCursor = () => {
  const mid = window.innerHeight / 2
  return cards.find((c) => { const r = c.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid }) || cards[0]
}

addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return
  const map = { a: 'approved', e: 'edit', r: 'rejected' }
  if (map[e.key]) { set(cardUnderCursor().dataset.code, map[e.key]); e.preventDefault(); return }
  if (e.key === 'j' || e.key === 'k') {
    const i = cards.indexOf(cardUnderCursor())
    const t = cards[Math.min(cards.length - 1, Math.max(0, i + (e.key === 'j' ? 1 : -1)))]
    t.scrollIntoView({ behavior: 'smooth', block: 'start' }); e.preventDefault()
  }
})

document.getElementById('next').addEventListener('click', () => {
  const t = cards.find((c) => !state[c.dataset.code]?.decision)
  if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

document.getElementById('export').addEventListener('click', () => {
  const out = document.getElementById('out')
  out.style.display = 'block'
  out.value = JSON.stringify(state, null, 2)
  out.select()
})

paint()
</script>
</body></html>`

mkdirSync(OUTDIR, { recursive: true })
writeFileSync(OUT, html)
console.log(`verification worksheet -> ${OUT}  (${markings.length} markings, ${(html.length / 1024).toFixed(0)} KB)`)
