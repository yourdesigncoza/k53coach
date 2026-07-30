/**
 * Attach the official DoT marking artwork to the `road_signs` marking rows and
 * close the ASSET gate only.
 *
 * The artwork is extracted from `init/RTSigns_charts.pdf` sheet 2 of 5 — the same
 * official chart every one of the 362 road signs was verified against. Because the
 * asset IS the ground truth rather than a redrawing of it, chart-verification is
 * satisfied by construction: there is no gap between what we ship and what the
 * Department published. That is recorded on each row, not assumed.
 *
 * What this does NOT do, deliberately:
 *
 *   `review_status` stays `draft`. That is the CONTENT gate — the meaning, driver
 *   action, common mistake and exam tip on each marking are AI-drafted and still
 *   need human verification (CLAUDE.md constraint 9). Markings stay invisible to
 *   learners until a person approves the words. Artwork alone does not ship them.
 *
 * Dry by default. Pass --apply to write.
 *
 *   node scripts/signs/markings/approve-marking-artwork.mjs            # preview
 *   node scripts/signs/markings/approve-marking-artwork.mjs --apply
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const PUBLIC = join(ROOT, 'public', 'markings')
const APPLY = process.argv.includes('--apply')

const envText = readFileSync(join(ROOT, '.env.local'), 'utf8')
const env = (needle) => {
  const line = envText.split('\n').find((l) => l.startsWith(`${needle}=`) || (l.includes(needle) && l.includes('=')))
  if (!line) throw new Error(`${needle} missing from .env.local`)
  return line.slice(line.indexOf('=') + 1).replace(/^"|"$/g, '').trim()
}
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = env('SERVICE_ROLE')

const SOURCE = 'National Department of Transport — "Road Traffic Signs" chart, sheet 2 of 5 (2000), ROAD MARKINGS section'
const LICENCE = 'Official government text (SA Copyright Act §12(8)(a))'

const files = readdirSync(PUBLIC).filter((f) => f.endsWith('.svg')).sort()
if (!files.length) throw new Error(`no SVGs in ${PUBLIC} — run extract-official-svg.mjs first`)

const now = new Date().toISOString()
const rows = files.map((f) => {
  const code = f.replace(/\.svg$/, '')
  const svg = readFileSync(join(PUBLIC, f))
  return {
    code,
    svg_file: `markings/${f}`,
    svg_hash: createHash('sha256').update(svg).digest('hex'),
    asset_status: 'approved',
    approved_by: 'ai:claude-code',
    verified_at: now,
    source: SOURCE,
    licence: LICENCE,
    attribution_required: false,
    in_official_chart: true,
    chart_match: true,
    verification: {
      match: true,
      method: 'vector extraction from the official chart (pdftocairo -svg, getBBox crop)',
      chart_file: 'init/RTSigns_charts.pdf',
      chart_page: 2,
      reason:
        'Artwork is the Department of Transport\'s own vector geometry lifted directly from the ' +
        'official chart, not a redrawing of it, so it matches the chart by construction. ' +
        'Cropped to the marking\'s vignette; no shape, colour or proportion altered.',
      note: 'ASSET gate only. review_status (content) remains draft pending human verification.',
    },
    bytes: svg.length,
  }
})

// The chart yields all 42 markings but only some have a learning object yet, and a
// PATCH on a code with no row succeeds while matching nothing. Split them explicitly
// so an artwork-only marking cannot be mistaken for one that was updated.
const existing = await (async () => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/road_signs?category=eq.marking&select=code`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  )
  if (!res.ok) throw new Error(`could not read marking rows: ${res.status} ${await res.text()}`)
  return new Set((await res.json()).map((r) => r.code))
})()

const updatable = rows.filter((r) => existing.has(r.code))
const orphans = rows.filter((r) => !existing.has(r.code))

console.log(`${rows.length} marking SVGs — artwork gate\n`)
for (const r of updatable) {
  console.log(`  ${r.code.padEnd(7)} ${r.svg_file.padEnd(24)} ${String(r.bytes).padStart(6)}b  ${r.svg_hash.slice(0, 12)}…`)
}
console.log(`\n  total ${(rows.reduce((a, r) => a + r.bytes, 0) / 1024).toFixed(0)} KB`)
console.log('  asset_status -> approved   |   review_status unchanged (draft — content gate stays closed)')

if (orphans.length) {
  console.log(`\n  ${orphans.length} SVGs have no marking row yet, so they are skipped:`)
  console.log(`    ${orphans.map((r) => r.code).join(' ')}`)
  console.log('    Artwork is ready; they need a learning object first — see docs/road-markings-catalogue.md')
}

rows.length = 0
rows.push(...updatable)

if (!APPLY) {
  console.log('\nDry run. Nothing written. Re-run with --apply to commit.')
  process.exit(0)
}

let ok = 0
for (const { bytes, code, ...patch } of rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/road_signs?code=eq.${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) { console.error(`  ${code} FAILED ${res.status}: ${await res.text()}`); continue }
  ok++
}
console.log(`\nUpdated ${ok}/${rows.length} marking rows. Content gate still closed — nothing is served yet.`)
