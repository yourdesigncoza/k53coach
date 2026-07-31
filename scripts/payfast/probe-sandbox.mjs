/**
 * Probe the PayFast sandbox to find which credential configuration it accepts.
 *
 * Background: a signed request to sandbox.payfast.co.za/eng/process is rejected with
 * "Generated signature does not match submitted signature". That was probed across
 * encoding variants (spaces as + vs %20, raw encodeURIComponent, no encoding,
 * lowercase hex) and every one failed identically, while the implementation matches
 * thephpleague/omnipay-payfast field-for-field. Both "no passphrase" and PayFast's
 * published passphrase also fail identically against the shared sandbox account —
 * which weakens rather than confirms the passphrase hypothesis, since an account
 * either has one or it does not.
 *
 * So this exists to answer one question: does the signature start working against a
 * sandbox account WE control? If yes, the shared public account carries a passphrase
 * someone else set. If no, the defect is in our signing, and the 41 unit tests do not
 * catch it (they are behavioural, not golden-vector — see payfast.test.ts).
 *
 * It imports the real signing code and the real config loader from src/lib/payfast.ts.
 * A probe that re-derives the signature, or re-types the credentials, proves nothing
 * about the code that ships.
 *
 * CREDENTIALS COME FROM .env.local, NEVER FROM ARGV.
 * Passing a passphrase as a command-line argument would leave it in shell history and
 * in `ps` output for every user on the box. This project already settled that rule for
 * PayFast values — they were piped into `vercel env add` via stdin so they never
 * entered a transcript or argv — and a probe is not an excuse to break it.
 *
 * To test your own sandbox account, register at sandbox.payfast.co.za and put this in
 * .env.local, then just run the script:
 *
 *   PAYFAST_SANDBOX_MERCHANT_ID=...
 *   PAYFAST_SANDBOX_MERCHANT_KEY=...
 *   PAYFAST_SANDBOX_PASSPHRASE=...
 *
 *   node scripts/payfast/probe-sandbox.mjs
 *
 * Requires Node 22+ (type stripping). Makes real POSTs to the sandbox; no money moves.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPaymentRequest,
  getPayfastConfig,
  payfastProcessUrl,
  SANDBOX_DEFAULTS,
} from '../../src/lib/payfast.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

if (process.argv.some((a) => a.startsWith('--passphrase'))) {
  console.error('Refusing to take a passphrase on the command line.\n')
  console.error('It would be recorded in shell history and visible in `ps` to every user')
  console.error('on this machine. Put PAYFAST_SANDBOX_PASSPHRASE in .env.local instead and')
  console.error('re-run with no arguments.')
  process.exit(1)
}

/** This is a plain node script, so .env.local is not loaded for us. */
function loadEnvLocal() {
  let text
  try {
    text = readFileSync(join(ROOT, '.env.local'), 'utf8')
  } catch {
    return 0
  }
  let n = 0
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    const value = m[2].trim().replace(/^["']|["']$/g, '')
    if (value && process.env[m[1]] === undefined) {
      process.env[m[1]] = value
      n++
    }
  }
  return n
}
loadEnvLocal()
process.env.PAYFAST_MODE = 'sandbox' // never let this probe touch the live gateway

const REQUEST = {
  paymentId: 'probe-0001',
  amountZar: 179,
  itemName: 'K53 Coach probe',
  itemDescription: '90-day access (probe, not a real order)',
  email: 'probe@k53coach.co.za',
  nameFirst: 'Probe',
  userId: '00000000-0000-0000-0000-000000000000',
  returnUrl: 'https://k53coach.co.za/en/pay/return',
  cancelUrl: 'https://k53coach.co.za/en/pay/cancel',
  notifyUrl: 'https://k53coach.co.za/api/pay/payfast',
}

const configured = getPayfastConfig()
const usingOwnAccount = configured.merchantId !== SANDBOX_DEFAULTS.merchantId

/**
 * The configured account first — that is the one that matters. The published pair is
 * kept as a control so a failure can be read as "ours too" rather than "ours only".
 */
const variants = [
  { label: usingOwnAccount ? 'our sandbox account' : 'published pair (as configured)', config: configured },
  ...(usingOwnAccount
    ? [{ label: 'published pair (control)', config: { mode: 'sandbox', ...SANDBOX_DEFAULTS } }]
    : [{ label: 'published pair, no passphrase', config: { mode: 'sandbox', ...SANDBOX_DEFAULTS, passphrase: '' } }]),
]

/**
 * PayFast names the offending field in the returned HTML; pull it out.
 *
 * Read the RESPONSE, not just the body. The engine page is rendered client-side, so a
 * successful request contains none of the words a naive body match looks for ("pay now",
 * "order summary", …) — an earlier version of this function returned `null` on success and
 * the script then printed the OPPOSITE conclusion, that our own account had failed. The two
 * reliable signals are the status code and the redirect target:
 *
 *   reject  → HTTP 400, body names the invalid field ("signature: Generated signature …")
 *   accept  → HTTP 200, redirected to /eng/process/payment/<uuid> — a transaction exists
 */
function diagnose(html, res) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const m = text.match(/The following information provided by the seller is invalid:\s*(.+?)\s*(?:Go Back|$)/i)
  if (m) return { ok: false, detail: m[1] }
  if (res.status >= 400) return { ok: false, detail: `http ${res.status}: ${text.slice(0, 160)}` }

  const txn = res.url.match(/\/eng\/process\/payment\/([0-9a-f-]{36})/i)
  if (txn) {
    const total = text.match(/Payment total:\s*(R\s?[\d\s,.]+)/i)
    return {
      ok: true,
      detail: `accepted — transaction ${txn[1]} created${total ? `, ${total[1].trim()}` : ''}`,
    }
  }
  return { ok: null, detail: text.slice(0, 160) || 'empty response' }
}

console.log(`POSTing to ${payfastProcessUrl('sandbox')}`)
console.log(`merchant_id in use: ${configured.merchantId}${usingOwnAccount ? '' : '  (PayFast published test account)'}`)
console.log(`passphrase configured: ${configured.passphrase ? 'yes' : 'no'}\n`)

let anyPass = false
for (const v of variants) {
  const { url, fields } = buildPaymentRequest(v.config, REQUEST)
  let res, html
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (k53coach payfast probe)',
      },
      body: new URLSearchParams(fields).toString(),
      redirect: 'follow',
    })
    html = await res.text()
  } catch (e) {
    console.log(`  ${v.label.padEnd(32)} NETWORK ERROR: ${e.message}`)
    continue
  }
  const { ok, detail } = diagnose(html, res)
  if (ok) anyPass = true
  console.log(`  ${v.label.padEnd(32)} ${ok === true ? 'PASS' : ok === false ? 'FAIL' : '????'}  http=${res.status}`)
  console.log(`  ${''.padEnd(32)}       ${detail}\n`)
}

if (anyPass) {
  console.log('Signature path works. The next step is a completed sandbox payment so the')
  console.log('ITN handler is exercised end to end, not just the outbound request.')
} else if (usingOwnAccount) {
  console.log('Our own account fails too, so the shared-passphrase theory is dead and the')
  console.log("defect is in our signing. Next: build a golden vector from PayFast's worked")
  console.log('example and assert it in payfast.test.ts — the current tests are behavioural.')
} else {
  console.log('Only the shared public sandbox was tested, and it is unreliable — anyone can')
  console.log('change its passphrase. Register at sandbox.payfast.co.za, add the three')
  console.log('PAYFAST_SANDBOX_* values to .env.local, and re-run before drawing conclusions.')
}
