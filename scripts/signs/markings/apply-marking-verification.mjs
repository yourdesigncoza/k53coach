/**
 * Apply a human verification pass to the road-marking learning objects.
 *
 * Reads the decisions exported from docs/markings-verify/index.html and writes them
 * to `road_signs`. This is the ONLY thing that opens the content gate on a marking,
 * and it will not run without a named human on the command line, because the whole
 * point of the gate (CLAUDE.md constraint 9) is that a person is on the record:
 * "AI drafts; it never self-certifies."
 *
 *   approved  -> review_status='approved', approved_by=<name>, verified_at=now
 *   edit      -> stays draft; the note is recorded so the rewrite has the reason
 *   rejected  -> stays draft; note recorded
 *
 * A marking only becomes learner-visible when asset_status, review_status AND
 * sa_relevant are all set — see SERVE_FILTER in src/lib/supabase/queries.ts.
 *
 *   node scripts/signs/markings/apply-marking-verification.mjs --by "John" [--apply]
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const DECISIONS = join(ROOT, 'docs', 'markings-verify', 'decisions.json')
const APPLY = process.argv.includes('--apply')

const byIdx = process.argv.indexOf('--by')
const BY = byIdx > -1 ? process.argv[byIdx + 1] : null
if (!BY) {
  console.error('Refusing to run: --by "<name>" is required.\n')
  console.error('The content gate records WHO approved an item and when. An unnamed approval')
  console.error('is not a verification, it is a rubber stamp — see CLAUDE.md constraint 9.')
  process.exit(1)
}
if (/^(ai|claude|gpt|bot)\b/i.test(BY.trim())) {
  console.error(`Refusing to run: "${BY}" is not a person.\n`)
  console.error('The content gate exists specifically to stop an AI pass certifying AI drafts.')
  process.exit(1)
}

if (!existsSync(DECISIONS)) {
  console.error(`No decisions file at ${DECISIONS}`)
  console.error('Open docs/markings-verify/index.html, work through it, press "Export decisions",')
  console.error('and save the JSON there.')
  process.exit(1)
}

const envText = readFileSync(join(ROOT, '.env.local'), 'utf8')
const env = (needle) => {
  const line = envText.split('\n').find((l) => l.startsWith(`${needle}=`) || (l.includes(needle) && l.includes('=')))
  if (!line) throw new Error(`${needle} missing from .env.local`)
  return line.slice(line.indexOf('=') + 1).replace(/^"|"$/g, '').trim()
}
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = env('SERVICE_ROLE')

const decisions = JSON.parse(readFileSync(DECISIONS, 'utf8'))
const entries = Object.entries(decisions).filter(([, d]) => d?.decision)
if (!entries.length) { console.error('No decisions recorded.'); process.exit(1) }

const now = new Date().toISOString()
const approved = entries.filter(([, d]) => d.decision === 'approved')
const held = entries.filter(([, d]) => d.decision !== 'approved')

console.log(`Verification by: ${BY}`)
console.log(`${entries.length} decisions — ${approved.length} approved, ${held.length} held back\n`)

for (const [code, d] of approved) console.log(`  ✓ ${code.padEnd(7)} approved${d.note ? ` — ${d.note}` : ''}`)
for (const [code, d] of held) console.log(`  · ${code.padEnd(7)} ${d.decision} (stays draft)${d.note ? ` — ${d.note}` : ''}`)

if (!APPLY) {
  console.log('\nDry run. Nothing written. Re-run with --apply to commit.')
  process.exit(0)
}

const patch = async (code, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/road_signs?code=eq.${encodeURIComponent(code)}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return (await res.json()).length
}

// Read current verification blobs so the human decision is added, not substituted
// for the extraction provenance already recorded there.
const current = await (async () => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/road_signs?category=eq.marking&select=code,verification`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } })
  if (!res.ok) throw new Error(`could not read markings: ${res.status}`)
  return Object.fromEntries((await res.json()).map((r) => [r.code, r.verification || {}]))
})()

let ok = 0, missing = []
for (const [code, d] of entries) {
  const verification = {
    ...(current[code] || {}),
    contentReview: { decision: d.decision, by: BY, at: now, ...(d.note ? { note: d.note } : {}) },
  }
  const body = d.decision === 'approved'
    ? { review_status: 'approved', approved_by: BY, verified_at: now, verification }
    : { verification }
  try {
    const n = await patch(code, body)
    if (n === 0) { missing.push(code); continue }
    ok++
  } catch (e) { console.error(`  ${code} FAILED: ${e.message}`) }
}

console.log(`\nWrote ${ok}/${entries.length} rows.`)
if (missing.length) console.log(`No such marking row: ${missing.join(' ')}`)
if (approved.length) {
  console.log(`${approved.length} markings now pass BOTH gates and will be visible to learners.`)
}
