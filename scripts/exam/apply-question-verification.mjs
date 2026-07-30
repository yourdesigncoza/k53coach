/**
 * Apply a human verification pass to the draft rules questions.
 *
 * Reads decisions from docs/question-verify/decisions.json and writes them to
 * `questions`. This is the ONLY thing that opens the content gate on a question,
 * and it will not run without a named human, because the whole point of the gate
 * (CLAUDE.md constraint 9) is that a person is on the record: "AI drafts; it never
 * self-certifies."
 *
 * The adversarial pass in docs/question-verify/findings.md is a TRIAGE, not a
 * sign-off. It returned 54 SOUND, 0 WRONG_ANSWER — but SOUND means "a reviewer
 * found a provision and quoted it", not "a person agreed". Those quotes exist so a
 * human pass takes minutes rather than hours; they do not replace it.
 *
 *   approved -> review_status='approved', approved_by=<name>, verified_at=now,
 *               source_citation=<the provision>
 *   anything else -> stays draft; the note is recorded
 *
 * decisions.json shape — { "RR-042": { "decision": "approved",
 *                                      "citation": "NRTR 2000 reg 326(1)(b)",
 *                                      "note": "optional" }, ... }
 *
 *   node scripts/exam/apply-question-verification.mjs --by "John"           # preview
 *   node scripts/exam/apply-question-verification.mjs --by "John" --apply
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DECISIONS = join(ROOT, 'docs', 'question-verify', 'decisions.json')
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
  console.error('Work through docs/question-verify/findings.md and verdicts.json, then write your')
  console.error('decisions there as { "RR-042": { "decision": "approved", "citation": "..." } }.')
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

const decisions = Object.entries(JSON.parse(readFileSync(DECISIONS, 'utf8')))
  .filter(([, d]) => d?.decision)
if (!decisions.length) { console.error('No decisions recorded.'); process.exit(1) }

const now = new Date().toISOString()
const approved = decisions.filter(([, d]) => d.decision === 'approved')
const held = decisions.filter(([, d]) => d.decision !== 'approved')

// An approval with no citation is exactly the failure the review found five times.
const uncited = approved.filter(([, d]) => !d.citation?.trim())
if (uncited.length) {
  console.error(`Refusing to run: ${uncited.length} approvals carry no citation.\n`)
  console.error(uncited.map(([id]) => `  ${id}`).join('\n'))
  console.error('\nConstraint 9 requires a citation to the specific provision an item rests on.')
  console.error('The review found five items citing "NRTA s 4(3)", which does not exist — a')
  console.error('missing citation is recoverable, a fabricated one is not. Add them and re-run.')
  process.exit(1)
}

console.log(`Verification by: ${BY}`)
console.log(`${decisions.length} decisions — ${approved.length} approved, ${held.length} held back\n`)
for (const [id, d] of approved) console.log(`  ✓ ${id.padEnd(8)} ${d.citation}`)
for (const [id, d] of held) console.log(`  · ${id.padEnd(8)} ${d.decision} (stays draft)${d.note ? ` — ${d.note}` : ''}`)

if (!APPLY) {
  console.log('\nDry run. Nothing written. Re-run with --apply to commit.')
  process.exit(0)
}

let ok = 0, missing = []
for (const [id, d] of decisions) {
  const body = d.decision === 'approved'
    ? { review_status: 'approved', approved_by: BY, verified_at: now, source_citation: d.citation }
    : { source_citation: d.citation || null }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) { console.error(`  ${id} FAILED ${res.status}: ${await res.text()}`); continue }
  if ((await res.json()).length === 0) { missing.push(id); continue }
  ok++
}
console.log(`\nWrote ${ok}/${decisions.length} rows.`)
if (missing.length) console.log(`No such question: ${missing.join(' ')}`)
if (approved.length) console.log(`${approved.length} questions are now live in the exam pool.`)
