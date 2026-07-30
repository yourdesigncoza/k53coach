/**
 * Probe the PayFast sandbox to find which passphrase configuration it accepts.
 *
 * Background: a signed request to sandbox.payfast.co.za/eng/process was being
 * rejected with "Generated signature does not match submitted signature". That was
 * probed across encoding variants (spaces as + vs %20, raw encodeURIComponent, no
 * encoding, lowercase hex) and every one failed identically, while the
 * implementation matches thephpleague/omnipay-payfast field-for-field. So the
 * remaining variable is not the encoding — it is the passphrase.
 *
 * PayFast's shared sandbox account only requires a passphrase if one is configured
 * on it, and its configured value is not necessarily the published jt7NOE43FZPn.
 * This script holds the request identical and varies ONLY the passphrase, so a
 * pass/fail difference isolates that one variable.
 *
 * It imports the real signing code from src/lib/payfast.ts rather than
 * reimplementing it — a probe that re-derives the signature proves nothing about
 * the code that ships.
 *
 *   node scripts/payfast/probe-sandbox.mjs
 *   node scripts/payfast/probe-sandbox.mjs --passphrase "your-own-sandbox-passphrase"
 *
 * Requires Node 22+ (type stripping). Makes real POSTs to the sandbox; no money
 * moves and no account is charged.
 */
import { buildPaymentRequest, payfastProcessUrl } from '../../src/lib/payfast.ts'

const argPass = (() => {
  const i = process.argv.indexOf('--passphrase')
  return i > -1 ? process.argv[i + 1] : null
})()

/** PayFast's published sandbox pair. Public, not secrets. */
const SANDBOX = { merchantId: '10000100', merchantKey: '46f0cd694581a' }

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

const variants = argPass !== null
  ? [{ label: 'supplied --passphrase', passphrase: argPass }]
  : [
      { label: 'no passphrase (empty)', passphrase: '' },
      { label: 'published jt7NOE43FZPn', passphrase: 'jt7NOE43FZPn' },
    ]

/** PayFast reports the offending field in the returned HTML; pull it out. */
function diagnose(html) {
  const errors = [...html.matchAll(/<li[^>]*>\s*([^<]*?)\s*<\/li>/g)]
    .map((m) => m[1].trim())
    .filter((t) => /signature|merchant|amount|required|invalid|not match/i.test(t))
  if (errors.length) return { ok: false, detail: [...new Set(errors)].join(' | ') }
  if (/Generated signature does not match/i.test(html)) return { ok: false, detail: 'signature mismatch' }
  // The sandbox renders a payment/confirmation page when the request validates.
  if (/(pay\s*now|confirm|order summary|amount due|payfast)/i.test(html) && !/error/i.test(html)) {
    return { ok: true, detail: 'request accepted — gateway rendered a payment page' }
  }
  return { ok: null, detail: 'unrecognised response' }
}

console.log(`POSTing to ${payfastProcessUrl('sandbox')}\n`)

for (const v of variants) {
  const config = { mode: 'sandbox', ...SANDBOX, passphrase: v.passphrase }
  const { url, fields } = buildPaymentRequest(config, REQUEST)
  const body = new URLSearchParams(fields).toString()

  let res, html
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (k53coach payfast probe)',
      },
      body,
      redirect: 'follow',
    })
    html = await res.text()
  } catch (e) {
    console.log(`  ${v.label.padEnd(26)} NETWORK ERROR: ${e.message}`)
    continue
  }

  const sig = fields.find(([k]) => k === 'signature')?.[1]
  const { ok, detail } = diagnose(html)
  const mark = ok === true ? 'PASS' : ok === false ? 'FAIL' : '????'
  console.log(`  ${v.label.padEnd(26)} ${mark}  http=${res.status} sig=${sig?.slice(0, 12)}…`)
  console.log(`  ${''.padEnd(26)}       ${detail}`)
  console.log(`  ${''.padEnd(26)}       ${html.length} bytes returned`)
  console.log()
}

console.log('If both FAIL, the shared sandbox has a passphrase we do not know.')
console.log('Register at sandbox.payfast.co.za, then re-run with --passphrase "<yours>",')
console.log('and set PAYFAST_SANDBOX_MERCHANT_ID / _MERCHANT_KEY / _PASSPHRASE in .env.local.')
