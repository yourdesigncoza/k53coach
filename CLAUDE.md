# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the product is

K53 AI Coach: a Progressive Web App helping South African learner drivers pass the K53 Learner's Licence test (Phase 1) and later the practical driving test (Phase 2). The differentiator is an AI tutor layer over verified K53 content — it explains *why* an answer is wrong, tracks weak areas, and produces a parent-readable readiness score. It is explicitly **not** "another quiz app".

The original specs live in `docs/product/` and still govern product intent — read them before product/scope decisions (`PRD.md`, then `PRD-additions.md` which **overrides** it, plus the two executive overviews). The official source documents they rest on — the Act, the regulations and their amendments, the 24 SARTSM manual volumes, the DoT sign chart — live in `resources/`, indexed with their authority and permitted use in `resources/README.md`. `docs/backlog.md` tracks deferred work.

## Project status

Live MVP slice, deployed. Built: free anonymous readiness test → parent-shareable score → paywall (PayFast/Yoco stubs) → app shell; three learner modules (Road Signs, Rules, Vehicle Controls) each with list + structured-learning-object detail + an AI "Explain my mistake" practice mode; bilingual EN/AF; Supabase-backed for signed-in learners. The road-sign library (DB1) is fully ingested and **chart-verified in a Claude Code session** — see `docs/sign-accuracy-pipeline.md`. **Mock exam (Code B) shipped:** entitlement-gated `/mock` → timed **64**-question paper (rules 30 / signs 28 / controls 6, scored independently — corrected from 68 on 2026-07-31, K53-34; see the evidence note on `EXAM_FORMAT_B`) → per-section summary → grounded AI assessment → DB9 readiness blend on the dashboard/progress. Engine in `src/lib/exam.ts`, UI in `src/components/exam/*`, gate in `src/lib/exam-guard.ts`.

**Live data measured 2026-08-04** against the prototype project (`lxefjksaxmiawrnnewmj`).
**Measure it yourself before quoting — these drift fast.** The 2026-07-30 figures that stood
here were wrong within two days on every row that matters, and the 2026-08-01 signs count
moved by 47 in three days:

| | |
|---|---|
| `road_signs` | **356 served** (both gates approved + `sa_relevant`). The 2026-08-03 artwork audit took 375 → 352 (13 blank plates, 3 non-SA signs withdrawn, 7 de-restriction signs corrected); 2026-08-04 added 4 that had artwork but no approved lesson — **`R1` Stop**, `IN1`/`IN2`/`IN3` Countdown. ⚠️ `R1` is the standard STOP sign and had been missing while `R1.1` (the doubled urban variant) served in its place — if a sign seems absent, check `review_status`, not just `asset_status` |
| `questions` | 276 rows — **274 approved**, 0 draft, 2 withdrawn. Approved: rules 120 / signs 117 / controls 37. All 274 carry an `objective_code`; **267 carry a `source_citation`** (the 7 without are a recorded exception — see below); **274 carry a human sign-off** (2026-08-05) |
| Rule learning objects | **30** (`RR1`–`RR30`; `RR30` "Temporary road signs" added 2026-08-03); controls 22 (`VC1`–`VC22`) — all still `reviewStatus: "draft"` |
| `exam_attempts` | 0 — no learner has sat a mock in production |
| `entitlements` | 4 — 3 by hand via admin, 1 (`ce1b7f96`) granted by a real PayFast ITN |

**Stage 1 content gate — all three sections are met, as of 2026-08-03.** The bar is the
*per-section split* 120 rules / 112 signs / 24 controls (not the 256 total). Measured above:
rules **120/120 ✅**, controls **37/24 ✅**, signs **117/112 ✅** — cleared when Louwrens
approved 44 sign drafts overnight on 2026-08-03.

**Every Stage 1 gate row is now closed, as of 2026-08-05.** Human sign-off — the last one
outstanding — was closed when John exported the bank to CSV, Louwrens read it and approved,
and the result was recorded across all 228 remaining rows
(`scripts/data-repairs/louwrens-csv-signoff-2026-08-05.json`). **`approved_by = 'system'` no
longer exists in the table**; all **274/274** approved questions carry a human sign-off:

| Gate row | State |
|---|---|
| Per-section question split | ✅ rules 120/120, signs 117/112, controls 37/24 |
| **Repeat suppression live** | ✅ `assemblePaper` takes the learner's last **2** completed papers and draws from what they haven't just answered. Measured at live pool sizes: paper-over-paper repeats **24% → 0%** |
| Payments live, idempotent, sandbox-tested | ✅ verified end to end 2026-08-03 (entitlement `ce1b7f96`) |
| **No orphaned topics** | ✅ all **274/274** approved questions resolve to a written lesson. The reverse direction is not clean — `VC20` is a lesson with no question — but that is a content gap, not this gate |
| Road-markings written library | ✅ 16 marking rows served, **26 approved markings questions** |
| **Every claim true** | ✅ `docs/claims-audit-2026-08-04.md` — 32 strings corrected across both locales |
| **Human sign-off** | ✅ **274/274** as of 2026-08-05 — 46 in-app (2026-08-03), 228 by CSV batch (see below) |

⚠️ **The claims audit found the paywall was the worst offender, not the landing page** — it
advertised a "Full 750-question bank" against 274 real ones (restored 2026-08-04 at John's request as **"growing to 750+"** — a target, not a count; a present-tense 750 on the payment screen is false by 476), and the privacy page promised
parent/guardian consent for minors that **is not implemented** (`profiles.parent_consent`
exists as a column; nothing in `src/` ever reads or writes it). Both are fixed in copy. Two
things the audit could *not* fix in copy are recorded at the end of that doc. The first —
six served signs with no recorded verification evidence — is **closed as of 2026-08-05**
(`scripts/data-repairs/six-unverified-signs-2026-08-05.json`); **every served sign now carries a
verification record**, and `verification is null` over the served set returns 0. The second
stands: **only `/mock` is entitlement-gated** — practice, explanations and the whole library are
already free, so R179 currently buys mock exams and the AI assessment. That one is a product
decision, not a wording bug.

⚠️ **That sign gap was bigger than "missing evidence" — `content` was `{}` on all six.**
`IN11.1`–`IN11.4`, `IN19` and `W346` were `approved` on both gates and served to learners with
**no lesson text in either locale**. The empty `verification` was the symptom; the empty lesson
was the defect, and only opening one of them in the admin editor showed it. **When a sign looks
thin, check `content`, not just the gates** — nothing in the served-set query
(`asset_status` + `review_status` + `sa_relevant`) can see an empty lesson. The `IN11.x`
`name_mismatch` flags were an extraction artifact: the chart lists the family as the *range*
`IN11.1 to IN11.5*`, so the matcher scored the tail of a range label. The names were right all
along — SADC RTSM Vol 1 §5.2.5(3) enumerates all four verbatim. **The new prose is AI-drafted
with `humanSignOff: false`** and belongs in the next human batch.

**Launch plan: `docs/build-plan-2026-07.md` (v2) — read it before scoping work.** Launch is a **two-stage gate**, not one bar: Stage 1 paid beta at **256 verified questions** at the per-section split 120 rules / 112 signs / 24 controls (a floor derived from the exam format — see the doc; was 300 before the 64-question correction, and **the split is the bar, not the total**) + payments live + no orphaned topics + road-markings written library + a claims audit; Stage 2 full launch at 736. Payments get built early but the **checkout stays closed** until the Stage 1 content floor is real. Tracked as **K53-32**.

⚠️ **Payments are half-wired — you still cannot buy access.** As of **2026-07-27** the *inbound* half is real: `src/app/api/pay/payfast/route.ts` validates an ITN (signature → source IP → PayFast's own `/eng/query/validate` → amount) and grants a 90-day entitlement idempotently, backed by the partial unique index `entitlements_payment_reference_key` on `(source, reference)`. Primitives live in `src/lib/payfast.ts` (unit-tested in `payfast.test.ts`); price/duration constants in `src/lib/pricing.ts` — the single source of truth, don't hardcode `R179` again.

The *outbound* half is built too: `POST /api/pay/payfast/checkout` signs a request (`buildPaymentRequest`, fields in `PAYMENT_FIELD_ORDER` — the order IS the spec) and the paywall replays the fields as a hidden form POST to the gateway. Credentials are selected **by mode**, so the live merchant ID can never be sent to the sandbox: `PAYFAST_MODE=sandbox` uses `PAYFAST_SANDBOX_*`, falling back to PayFast's published test pair. Mode defaults to sandbox — an unset `PAYFAST_MODE` cannot point real money at production.

**Checkout is closed by default** and gated on `NEXT_PUBLIC_PAYFAST_CHECKOUT_ENABLED=true`, enforced in the route (503) as well as the UI — currently set on Vercel **Preview + Development only**, never Production, per the Stage 1 gate (K53-32). The prototype bypass `NEXT_PUBLIC_ENABLE_TEST_CHECKOUT` was **removed from Vercel Production** (still in `.env.local` for local use); `startTestCheckout()` is guarded on it server-side, so the paid path fails closed in prod.

✅ **Signature path verified 2026-07-31 — the shared-sandbox-passphrase theory was right.** With John's own registered sandbox account in `PAYFAST_SANDBOX_MERCHANT_ID`/`_MERCHANT_KEY`/`_PASSPHRASE`, a signed request to `sandbox.payfast.co.za/eng/process` is **accepted**: HTTP 200, redirected to `/eng/process/payment/<uuid>` with the R179 order rendered. The published test pair, run as a control in the same pass, still returns HTTP 400 *"signature: Generated signature does not match submitted signature"* — so the defect was never in our signing (which matches `thephpleague/omnipay-payfast` field-for-field); it was the shared account's passphrase, which anyone can change. `npm`-free repro: `node scripts/payfast/probe-sandbox.mjs` (no arguments — it refuses a passphrase on argv by design).

⚠️ **Two traps this cost a session, both worth knowing:**
- **The probe's own verdict was wrong before it was fixed.** `diagnose()` matched body text ("pay now", "order summary") to detect success, but the engine page renders **client-side**, so a *successful* response contains none of those words. It returned `????`, `anyPass` stayed false, and the script printed the opposite conclusion — "our own account fails too, so the passphrase theory is dead". Now it reads the **status code and the redirect target** instead. Never take that script's closing paragraph over the per-variant rows.
- **`.env.local` sandbox keys are easy to misname.** If `PAYFAST_SANDBOX_MERCHANT_KEY`/`_PASSPHRASE` are typed without the `SANDBOX_` infix they silently shadow the **live** values, and `payfast.ts:77-79` falls back to PayFast's published pair — reproducing the original failure while looking configured. Check the names, not just that values are present.

✅ **The inbound half is verified end to end — 2026-08-03.** A real sandbox payment was
completed and PayFast's ITN granted access unaided: entitlement `ce1b7f96`, the first row in
the table with `source: payfast`, `reference` = PayFast's own `pf_payment_id` (`3304360`),
expiring `granted_at` + 90 days. All four gates in `verifyItn` passed against live traffic
(signature → source IP → PayFast's `/eng/query/validate` → amount), and the paid account then
reached `/en/mock` while a second checkout correctly returned 409 `already_active`. Replaying
the same `(source, reference)` is rejected by `entitlements_payment_reference_uniq` (23505),
so the handler's duplicate-delivery branch rests on a constraint that demonstrably fires.

**How to re-run it — PayFast must reach `notify_url` from the public internet, which is the
whole reason this went untested for so long.** Neither localhost nor production works: prod is
correctly closed by the Stage 1 gate (503 `checkout_closed`), and Vercel previews are behind
SSO (`ssoProtection: all_except_custom_domains`) *and* carry neither `PAYFAST_SANDBOX_*` nor any
Supabase keys, so a preview would sign with PayFast's published test pair against no database.
Rather than weaken any of that, tunnel the local dev server — no install, no Vercel change:

```bash
ssh -o ExitOnForwardFailure=yes -R 80:localhost:3000 nokey@localhost.run   # prints https://<id>.lhr.life
node scripts/e2e/flow.mjs checkout entitled --base https://<id>.lhr.life --pay
```

`siteOrigin()` reads the forwarded host, so `notify_url` follows the tunnel automatically. Kill
the tunnel afterwards — while it is up, the dev server is on the public internet. The e2e buyer
now holds a live entitlement, so a repeat run stops at 409; clear it first to test payment again.

Deferred (`docs/backlog.md`): Code A/C papers, full pass-prediction, dashboards, practical-driving coach, the Afrikaans content pass, next-pwa service worker.

- **Production:** https://k53coach.co.za (also k53coach.vercel.app; Vercel project `yourdesigncozas-projects/k53coach`; GitHub `yourdesigncoza/k53coach` auto-deploys on push).
- **Supabase (prototype):** project `k53coach`, ref `lxefjksaxmiawrnnewmj`, eu-west-1.

## Project management (Linear)

From here on this project is tracked in **Linear**, in its **own dedicated free workspace
`k53-coach`** (`linear.app/k53-coach`) — kept separate from the Wecoza workspace so the only
other collaborator, **Louwrens** (`louwrensluyt@gmail.com`, now invited), sees *only* K53.

- Team **K53 Coach** (key `K53`); work lives under the **Post-MVP Roadmap** project, grouped
  into 5 milestones (Monetisation & Access, Exam engine v2, Bilingual content, Platform,
  Compliance (POPIA) — now moot, see constraint 1), seeded from `docs/backlog.md`.
- **Todo** is reserved for currently-queued work; deferred items stay in **Backlog**.
- **Issues Louwrens will read are written for him** — plain, non-technical client block on top,
  `### Technical notes (dev team)` below a divider. Never put infrastructure detail (Vercel, env
  vars, service-role keys, file paths) in the client block. **K53-32** is the current direction.
- The CLI can't create teams or invite users, and `issue create` has no `--milestone` (attach after
  creation). For anything the CLI can't reach, the Linear GraphQL API works directly with the same
  key — that's how issue relations, duplicate-state moves and comment *edits* get done.
- Driven via the `pi-linear-tools` CLI using the **k53-coach-scoped** `LINEAR_API_KEY` in
  `.env.local` (pass it inline — do **not** overwrite the CLI's stored Wecoza key). Details in
  project memory: `linear-k53-coach-workspace`.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build (Turbopack)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # node's built-in runner (--experimental-strip-types), src/**/*.test.ts

# Run one file / one test
node --experimental-strip-types --test src/lib/payfast.test.ts
node --experimental-strip-types --test --test-name-pattern "signature" src/lib/payfast.test.ts

# Road-sign pipeline (needs pdftotext + network; see scripts/signs/README.md)
npm run signs:extract  # pull sign codes/names out of the official chart PDF
npm run signs:fetch    # fetch SVGs from Wikimedia + record provenance
npm run signs:ingest   # wiki ingest (the current entry point)
npm run signs:seed     # push the ingested set into road_signs

# Question bank (see scripts/exam/README.md)
npm run exam:build-migration   # regenerate the questions migration from the wiki bank

# Supabase (CLI is split: `supabase` + `supabase-go`, both in ~/.local/bin)
supabase db push                 # apply migrations in supabase/migrations to remote
supabase migration new <name>    # new timestamped migration
supabase config push             # push supabase/config.toml (incl auth URLs) to remote
supabase gen types typescript --linked > src/lib/database.types.ts

vercel --prod        # deploy to production (prod env vars already set on Vercel)
```

**There IS a test setup** — no third-party framework, just Node's built-in runner over TypeScript via `--experimental-strip-types`, so nothing to install. **56 tests currently pass** across `payfast.test.ts`, `weak-areas.test.ts`, `readiness-sample.test.ts` and `exam.test.ts`. Coverage is deliberately narrow: the places where a silent logic error costs money or misleads a learner — payment signing, weak-area ranking, the readiness sample, and mock-paper assembly (repeat suppression must never starve a section). Add a `*.test.ts` next to the module and it is picked up — don't add Jest/Vitest for it.

The app runs **without Supabase env vars** ("demo mode" — auth/persistence simulated); real keys live in `.env.local` (gitignored). Network here is IPv4-only, so Supabase DB commands use the pooler (this is why `supabase link` was re-run).

**Next.js 16 is not the Next.js you know** (`AGENTS.md`): APIs, conventions and file structure differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code, and heed deprecation notices.

## CodeGraph (code intelligence — use before grepping)

**CodeGraph** (`@colbymchenry/codegraph`) is the code-graph tool for this repo — AST-precise symbols/edges with `file:line`. Prefer it over raw grep for "who calls X / what depends on Y". Installed local: `~/tools/codegraph/node_modules/.bin/codegraph` (not on PATH — use the full path); index in `.codegraph/` (gitignored). It **auto-syncs on file changes** — no rebuild ritual; `codegraph status` shows state, `codegraph sync` forces an incremental refresh if it looks behind.

```bash
CG=~/tools/codegraph/node_modules/.bin/codegraph
"$CG" query "<keyword>"        # find symbols (dup-check before writing new code)
"$CG" node <Symbol>            # source + callers + callees trail
"$CG" callers <Symbol>         # every direct call site
"$CG" impact <Symbol>          # transitive blast radius (regression check)
"$CG" explore <query...>       # relevant symbols' source + call paths in one shot
git diff HEAD --name-only | "$CG" affected --stdin   # changed files -> dependents
```

MCP equivalents `mcp__codegraph__*` are registered (project-scoped, `claude mcp list`) and load at **session start** — restart Claude Code to get the tools; the CLI is canonical and works immediately.

## Technical architecture (as built)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (**Base UI** primitives) · Supabase (Postgres + Auth, SSR) · Vercel.

These are the cross-cutting rules that aren't obvious from a single file:

- **Locale routing owns the route tree.** Every page lives under `src/app/[locale]/` (`en`/`af`). `app/[locale]/layout.tsx` is the *root* layout (`<html lang>`, `NextIntlClientProvider`, theme, fonts) — there is no `app/layout.tsx`. Only `app/api/`, `app/manifest.ts`, `app/globals.css`, `app/favicon.ico` sit outside `[locale]`.
- **Always import navigation from `@/i18n/navigation`** (`Link`, `useRouter`, `usePathname`, `redirect`) — never `next/link` or `next/navigation` for those, or the active locale is dropped. `notFound`, `generateStaticParams`, `generateMetadata` still come from `next`.
- **i18n strings** live in `messages/{en,af}.json`, namespaced by screen (`nav`, `landing`, `readiness`, `module`, …). Use `useTranslations` in client + sync server components, `getTranslations` (awaited) in async server components. Add a language: extend `src/i18n/routing.ts` + add `messages/<locale>.json`. Config: `src/i18n/{routing,request,navigation}.ts`. `messages/af.json` is a first-pass draft pending native review.
- **UI chrome is translated; content + category labels are NOT yet.** Learner content (signs/rules/controls prose, questions in `src/content/*.ts`) and the category taxonomy labels (in the content meta) are still English — that's the deferred bilingual content pass.
- **Supabase clients degrade gracefully.** `src/lib/supabase/{client,server,middleware}.ts` return `null` when env vars are absent (demo mode). All are typed via `src/lib/database.types.ts` (regenerate after schema changes). Server-side reads live in `src/lib/supabase/queries.ts`. Persistence (attempts, readiness snapshots) happens client-side via the browser client, guarded by an auth check; **RLS** enforces own-row access on every table.
- **`src/proxy.ts` is the middleware** (Next 16 renamed `middleware`→`proxy`). It composes the next-intl locale middleware with Supabase session refresh — order matters (intl builds the response, Supabase writes cookies onto it).
- **All app LLM calls go through `src/lib/llm.ts` (OpenAI `gpt-5.4-mini`, `OPENAI_API_KEY`).** One entry point (`llmChat` + `hasLlmKey`), direct fetch, graceful when the key is absent. Use it for any new AI feature — do not call a provider API directly or hardcode a model. Currently only **offline/admin** drafting uses it (no runtime learner-facing AI — see below).
- **No runtime AI in the learner flow (deliberate).** Practice/test explanations are **hard-coded verified content** shown directly (`q.explanation`) — there is no per-question LLM call. AI is used only **offline** to draft initial content for human review (`src/app/api/admin/draft-sign/route.ts`, the translation manager's AI-draft) and is reserved for a **future post-test coaching** feature (score-improvement suggestions / recommended learning), not per-question rephrasing. The old `/api/ai/explain` rephrase route was removed. Editable answers/explanations are managed in admin Content Management (DB-backed question bank — see `docs/backlog.md`). When adding AI, it must stay grounded in verified content and never invent legal/safety claims.
- **Content as structured learning objects.** `src/content/{road-rules,vehicle-controls,readiness-questions}.ts` are typed data (`src/lib/types.ts`). **Road signs are DB-backed, not a TS file** — the `road_signs` table (362 rows) holds artwork + provenance + bilingual `content` + verification evidence; learner pages read it via `getApprovedSigns*` (served set = both gates approved + `sa_relevant`), admin via `getSigns`. Signs render via `SignImage` from the real PD SADC SVG in `public/signs/<code>.svg` (`svg_file`). Verification against the official chart is automated in a Claude Code session — see `docs/sign-accuracy-pipeline.md` + `scripts/signs/`.
- **Theme is warm brown + gold (the brand palette).** Tokens in `src/app/globals.css`: brown `--ink-*` (`#221813`/`#3b2a22`), `--gold-400` (`#ffc46b`) as `--primary` in every zone, ivory/sand neutrals (`--surface-2` `#faf7f2`), `--gold-ink` for readable gold on white; semantic green/amber/red only as soft readiness-badge tints. The Coach K artwork is built on this same brown/gold scheme. Mobile-first: `[locale]/(app)` uses a bottom tab bar on mobile and a left sidebar on `md+`. Base UI components use a `render` prop for polymorphism (not Radix `asChild`).
- **Contained-panel rule for test/learning content.** Every test/learning flow (readiness test, practice mode, quiz-style learning) renders its content inside a **single white `bg-card`/`--surface` panel that floats on the ivory canvas** — never flat on the background. This mirrors the client-approved prototype's `.quiz-main`. Use the shared `<QuizPanel>` (`src/components/quiz/quiz-panel.tsx`); don't hand-roll the frame. The dark marketing/landing zone is the separate `.theme-dark` storefront.
- **Option order is shuffled per sitting — use `src/lib/shuffle.ts`.** `shuffle` + `shuffleOptions` live there because `exam.ts` and `readiness-sample.ts` had each grown their own copy. Stored option order is fixed, so any surface that renders a question to a learner must map `shuffleOptions` over it or the same answer sits in the same slot forever — a retake becomes recall of position, and the bank's index bias (101/96/77 across the 274 approved three-option questions) is guessable. **All three learner surfaces do this**: `assemblePaper` (mock), `sampleReadinessQuestions` (free test) and `getShuffledPracticeQuestions` (practice — in the getter, since the three practice pages are otherwise identical; the **name** carries the contract, so never wrap it in `React.cache()` or `use cache`, which would freeze the order and reinstate the defect). Question *order* is only randomised in the first two; practice keeps `sort_order` because it is a walk through a topic, not a draw. `shuffleOptions` **throws** on an out-of-range answer index rather than silently yielding `answer: -1` — `saveQuestion` guards that on write, but `scripts/data-repairs/*` patch rows straight through PostgREST and bypass it.
- **One quiz chrome, everywhere (pixel-identical).** The readiness test, practice mode AND the landing quiz demo all render through the same components in `src/components/quiz/` — `QuizPanel`, `QuizHead`/`QuizScore`, `QuizProgress`, `QuestionCard`, `AnswerOption`, `CoachCard`, `QuizButton`. Never restyle a quiz surface locally; change the shared component. Full spec in the `globals.css` header.
- **Forms consistency.** All form controls come from `src/components/ui/*` (shadcn primitives, token-tinted). Never hand-roll inputs/selects/checkboxes with ad-hoc classes; missing control types get added to `ui/` once. Reference form: `src/app/[locale]/auth/page.tsx`.
- **Mobile uses the MINIMUM padding (always responsive).** Never ship a single desktop-sized padding. On phones (base classes) use the minimum padding that still reads and stays tappable; add roominess back only at `md+`. Defaults: panels/cards `p-4 md:p-6`; page gutters `px-4 md:px-8`; tappable rows `px-3 py-2.5 md:px-4 md:py-3`. Never stack padding (a `Card`'s own pad + a `CardContent py-5` reads double-padded on mobile). For prototype-pinned surfaces, tighten only the base value and pin `md:` to the prototype. Full spec in the `globals.css` header.
- **Reuse existing components — do not duplicate.** Default to the pre-built components before writing anything new: `src/components/ui/*` (shadcn primitives), the shared quiz chrome (`src/components/quiz/*` — `QuizPanel`, `QuizHead`/`QuizScore`, `QuestionCard`, `AnswerOption`, `CoachCard`, `QuizButton`), `ReadinessRing`, `SiteHeader`/`SiteFooter`, `Icon`, etc. **Before building a component, check if one exists** — `codegraph query "<name>"` (or search `src/components/`) — and if a close one exists, extend/parameterise it rather than re-implementing. Re-implementing an existing surface is how pixel/behaviour drift creeps in (e.g. the assessment demo first duplicated the coach card with roomier padding instead of reusing `CoachCard`). One implementation per concept.
- After schema changes: edit/add a migration in `supabase/migrations/`, `supabase db push`, then regenerate `database.types.ts`. Remote auth/config is code in `supabase/config.toml` (push with `supabase config push` — note it syncs the *whole* file, not just your edit).

## Non-obvious constraints that shape implementation

These are easy to miss and have architectural consequences. Honor them in any design or code.

1. **POPIA — settled; do not re-raise as a launch gate.** John closed this concern on **2026-07-24** and canceled K53-17. The original PRD-additions §7 position (Supabase/Vercel prototype-only pending a POPIA review; SA data residency, cross-border transfer, operator agreements, retention) is **superseded** — treat it as historical context, not a live blocker. It reads as outstanding in `docs/product/PRD-additions.md`, which is why reviewers keep flagging it; the settled position is here. The *design* principles still hold and are cheap to honour: collect minimal PII, keep the payment screen parent-facing, and don't invent new personal-data collection without asking.

2. **No biometric storage, ever (PRD-additions §4, overview §10).** Anti-account-sharing uses device-native passkeys / WebAuthn / Face ID / Touch ID handled *by the device*. The app never collects or stores fingerprints, face scans, or biometric identifiers. Model: one primary device per account, re-auth only on suspicious/new-device usage. Never interrupt a live mock exam with an auth prompt.

3. **Under-18 users are expected (overview §11).** Target market includes Grade 11/12 learners. The free readiness test is anonymous and **device-local** — the result is persisted only in the browser via `localStorage` (`src/lib/storage.ts` `saveReadinessResult`/`loadReadinessResult`), so an unregistered learner keeps their score across sessions with nothing sent to a server. This is distinct from **server-side** persistence of a minor's personal progress (the `readiness_results` table), which still requires sign-in + parent/guardian consent. Keep the payment screen parent-facing; collect minimal PII.

4. **Content is the moat, not the code (overview §12, PRD-additions §3).** Do NOT scrape/copy competitor apps, screenshots, or paid manuals. **Sign-sourcing strategy (overrides the "redraw everything" reading of PRD-additions §3):** the SADC/SA official road signs on Wikimedia Commons are Public Domain under SA Copyright Act §12(8)(a) and may be used commercially — source sign SVGs from Wikimedia rather than redrawing or AI-inventing them. BUT Commons licences are **per file**: every SVG must be licence-audited individually and verified against the official DoT chart (`resources/charts/RTSigns_charts.pdf`), then stored with an `AssetProvenance` record (`src/lib/types.ts`). The real moat is the **original learning content** — plain-English explanations, behaviour, common mistakes, test hints, and questions (AI-drafted → AI-verified vs the chart → human exceptions only) — NOT the glyph. Verification is **automated in a Claude Code session** against the chart ground truth (vision + semantic + content-factuality), recorded auditably (`approved_by`, `verification`, `svg_hash`, `verified_at`); only uncertain signs reach a human. See `docs/sign-accuracy-pipeline.md` (execution plan) and `docs/road-sign-assets.md` (overview), scripts in `scripts/signs/`. Each `road_signs` row has two independent gates — `asset_status` (SVG licence/chart-verification) and `review_status` (content accuracy) — plus `sa_relevant`; all three gate the served set.

5. **Pricing model is once-off, not subscription (PRD-additions §1 & §6, overview §7).** R149–R199 once-off for 90 days full access, then optional R20/month for continued AI Coach access only. Schools: R99/learner/90 days. The R20/month covers AI inference cost — it is not a subscription trap. KPIs are framed around free-test→paid-unlock conversion and parent share rate, **not** "subscription conversion" (the PRD's original wording is superseded).

6. **MVP scope is narrower than the PRD's full Phase 1 (PRD-additions §5, overview §14).** The MVP must prove the business (learners use it, parents pay, schools work as a channel, AI explanations add value) before building full dashboards, full pass-prediction, practical driving coach, voice tutor, or photo/video recognition. Defer anything in the "MVP Should Not Include Yet" list (overview §14).

7. **Third-party study guides are a coverage checklist, never a source.** The client supplied a commercial K53 study guide he does **not** own. Its prose, illustrations, formatting and arrangement are copyright; only the *topic labels* (facts/scope) are free. Method — extract bare topic labels → draft every explanation from the National Road Traffic Act 93 of 1996 + regulations and the official chart → diff the labels against what we wrote to find gaps. **The PDF must never be passed as context to `llmChat` or any drafting prompt** — that is where regurgitation of protected expression happens. Full method + the current gap analysis: `docs/rules-coverage-checklist.md`.

8. **Languages are English + Afrikaans, full stop.** Both ship as real deliverables. Do **not** propose isiXhosa or any other official language — speakers of the African languages generally prefer English, so English serves them (John, 2026-07-24). English is drafted first; Afrikaans follows as a content pass. Stage 1 ships English-only *questions* — marketing must not imply otherwise.

9. **Accuracy gate = recorded evidence, not intent.** Any generated question or rule must carry a citation to the specific regulation/chart entry it rests on, plus who approved it and when. **AI drafts; it never self-certifies** — verification by another pass of the same model against the same prompt is circular and worthless. Item-level checks, not sampling; a client spot-check is *style* calibration and does not count as QA. **Every citation is read out of `resources/`** — the Act, the regulations, the 24 SARTSM volumes and the DoT chart, indexed in `resources/README.md`. Quote the text; never cite from recall or from an earlier summary. Two traps that have already produced wrong verdicts are recorded there: the 2000 NRTR original is **not** the text in force for several regulations (reg 297(2), reg 101(1)), and the chart's marking labels are vector, so absence of extracted text is not absence from the chart. See also constraint 7 for the memo scans in `resources/restricted/`, which are format reference only.

10. **Learner-facing prose teaches; it is not a technical spec. (John, 2026-08-03 — hard rule.)** The reader is a person trying to get a licence, not a reviewer auditing our sources. Everything they see — question explanations, sign/rule/control lesson bodies, `summary` / `whatItDoes` / `howToUse` / `commonMistake` / `testHint` — must **educate and guide**: plain language, the thing they'll actually do at the wheel, and the confusion the item turns on. **Accuracy is non-negotiable (constraint 9) but it is proven in the citation field, not performed in the prose.** Concretely:
    - **Citations belong in `source_citation`, not in the explanation.** Naming a schedule or reg number at a 17-year-old teaches nothing. The one exception is where the provision's *text is the teaching point* — `q-signs-5` cites Schedule 1 because the P/S letters inside the sign are literally the answer.
    - **Write what the driver does, not what the regulation says.** "Give way to anyone already on it" — not reg 315(2)'s "a pedestrian upon that half of the roadway upon which the vehicle is travelling".
    - **Lead with the confusion the question turns on**, the way the strongest items in the bank already do: *"A minimum-speed sign would be blue"*, *"not accelerate to beat the red"*, *"Two lines are stricter"*.
    - **House length, measured across the 71 approved signs explanations: median 187 characters, max 397.** If it is running past that, it is probably explaining the law rather than the driving.
    - **Do not import a foreign misconception to knock it down.** If the confusion came from our own bad content rather than from SA learners, naming it plants it.

    This is the failure that produced the first W306 explanation — technically correct, quoting Schedule 1 verbatim, and useless to a learner. Verification register and learner register are different jobs; keep the rigour in `resources/` and the citation column, keep the prose readable.

## Roles & data model anchors

User roles: Learner, Parent, School, Admin. The PRD's numbered "Databases" are logical content/engine domains, not literal tables: road signs (DB1), road rules (DB2), vehicle controls (DB3), questions+explanations (DB4, ~750 Q), AI coaching cards (DB5), exam generator (DB6), analytics/prediction (DB7), readiness scoring (DB9 — 40% mock avg / 25% topic accuracy / 20% weak-area improvement / 15% consistency), dashboards (DB10), legal docs (DB12).

Implemented Postgres tables (RLS, own-row policies): `profiles` (auto-created on signup; role/locale/consent flags, minimal PII), `attempts` (per-question, feeds DB7), `readiness_results` (DB9 snapshots), `road_signs` (DB1), `questions` (DB4), `entitlements` + `exam_attempts` (paid access + mock results). The readiness scoring helper is `src/lib/readiness.ts`.

**Both schema gaps that used to be listed here are CLOSED** — don't re-raise them:

- `questions` audit trail — added by `supabase/migrations/20260724090000_question_provenance.sql` (`approved_by`, `verified_at`, `generated_by`, `source_citation`, `objective_code`).
- `entitlements` idempotency — the partial unique index `entitlements_payment_reference_key` on `(source, reference)` landed in `supabase/migrations/20260727120000_payfast_itn_idempotency.sql`.

**The audit columns are now populated.** Measured 2026-08-05 across the 274 approved questions: `objective_code` **274/274**, `source_citation` **267/274** (the 7 are the recorded exception below), `verified_at` **274/274**.

The citation column was backfilled on 2026-08-04 (`scripts/data-repairs/question-citations-2026-08-04.json`, 232 → 267), which unblocks the human pass — an uncited question cannot be verified at all, because there is nothing to check it against. **The 7 still uncited are uncitable, not overlooked**: dashboard warning lights, head restraints ×2, demister, ABS ×2, motorcycle braking-before-the-turn. `resources/` covers law, signs and syllabus and **does not reach vehicle safety technology**. They are a recorded exception, kept deliberately — see the next paragraph. Don't "fix" them with an invented citation. **Sixteen more carry a `NOTE FOR THE HUMAN VERIFIER`** because the source supports the item but not the keyed answer — read those first, they are where a wrong answer is most likely hiding. Both lists are in `docs/verification-worklist.md`.

⚠️ **The 7 uncited questions are a deliberate, recorded exception — do not "fix" them.** They were withdrawn on 2026-08-04 and **restored the same day** (John: the content is fine and reasonable). Nothing in `resources/` covers dashboard warning lights, head restraints, demisters, ABS or motorcycle cornering, and losing correct teaching over an absent citation was judged the worse trade. They carry `source_basis = 'uncited_general_knowledge'` — the one honest label for the set, replacing six false `official_manual` claims the citation pass disproved. **Leave `source_citation` NULL**: it is the true statement, and `source_citation is null` is the query that returns exactly this set. One live caveat: **`VC-016` is motorcycle-only** (`vehicle_codes: ['A']`), so it is approved but unreachable until a Code A paper ships — as are `VC-010`, `VC-027`, `VC-028`, `VC-029` and `RR-062`. **Two more are unreachable for the same reason but a different code**, and are easy to miss because they aren't motorcycle: `RR-003` (`['C']`, goods vehicle over 9 000 kg) and `RR-035` (`['EB']`, towing over 750 kg). **Eight approved questions in total serve no learner today.** They are correctly scoped, not defects — but the Code B pool is 117/117/32, not 120/117/37, and the admin pool-health strip is the honest number. `q-controls-5` had a second, unrelated defect — it keyed "check before driving" for a **red** light — and was rewritten on 2026-08-04 to teach **red = stop, amber = check**.

⚠️ **Regs 149 and 213 were amended by GNR.846 of 31 Oct 2014 — *later* than the consolidated copy in `resources/legislation/` (GNR.209 of 9 Mar 2012).** Reg 149 was substituted wholesale. Check `nrtr-amendment-2014-gg38142-gnr846.pdf` as well as the consolidated file before citing any regulation; the recorded "the 2000 original is not the law in force" trap reaches one consolidation further forward than expected. The two repair files are a pair — `question-citations-2026-08-04.json` carries a `superseded_in_part_by` guard and **must not be replayed without its follow-up**, which would revert four citations to superseded wording.

**Read `approved_by` before you read `review_status`** — since `20260804090000_question_approver_system.sql` it is `text`, not a uuid, and it names which kind of approval happened:

| `approved_by` | `verified_at` | Means | Count |
|---|---|---|---|
| a user id | seconds apart | approved one at a time in the admin UI | **46** (Louwrens, 2026-08-03, all signs) |
| a user id | one shared instant | approved as a **CSV batch** | **228** (Louwrens, 2026-08-05) |
| `'system'` | null | AI sweep set the flag; nobody read it | **0** — no longer exists |

**The granularity is the whole distinction now that the column is full, and the timestamp is
how you read it.** The 46 were ticked individually, so their `verified_at` values are seconds
apart. The 228 share one identical instant because they were signed off as a single CSV export
rather than item by item — same approver, same authority, coarser granularity.
`verified_at = '2026-08-05T09:02:42.538Z'` recovers exactly that batch. Don't flatten the two
into "274 verified" without knowing which question you're asking about.

- **Two subsets inside the CSV batch are where a wrong answer is most likely to have survived**, and both are named in their per-op `why` in the repair file: the **16 partial citations** (source supports the item but not the keyed answer — `RR-054` keys "four seconds or more" in heavy rain and no source states any figure) and the **7 deliberately uncited** questions. If a learner-reported error ever lands, start there.
- The 7 approved questions with no `source_citation` are uncitable as they stand. Before quoting bank size as evidence of readiness, check what share carries evidence.

`review_status` has a third value, **`withdrawn`** (`20260804100000`) — deliberately pulled, awaiting nobody, reason recorded in `scripts/data-repairs/`. It is not a `draft`: leaving pulled items in the draft queue sent a reviewer chasing two questions we had already decided against. The admin list hides withdrawn by default; learner getters and RLS already filter on `= 'approved'`, so serving is unaffected.

`docs/verification-worklist.md` was the human-pass worklist — **closed 2026-08-05** by the CSV batch; it survives as the record of what was flagged going in. The sweep that produced the state Louwrens reviewed is written up in `docs/question-verify/`.

**Learning-objective codes** tie questions to lessons via `questions.objective_code`: signs → `road_signs.code` (e.g. `R1`), rules → `RR1`–`RR29` (`src/content/road-rules.ts`), controls → `VC1`–`VC22` (`src/content/vehicle-controls.ts`). All three series exist. **Codes are shared by design** — several questions per objective is what an objective is for (11 of the `VC*` codes carry more than one), so a repeated code is not a mis-mapping. **Coverage is now complete: 227/227 approved questions carry a code** (the 2026-07-24 backfill left 12 orphans; they were closed by `scripts/data-repairs/orphan-objectives-2026-07-31.json`). What remains is the reverse direction — objectives with no lesson written, tracked in `docs/rules-coverage-checklist.md` and `docs/question-verify/approved-bank-findings.md` §7.
