# Backlog / deferred work

Durable list of things intentionally not done yet, so they don't get lost.

## PWA service worker — add next-pwa
Current PWA support is **manifest + icons only** (installable, themed) — there's
no service worker, so no real offline support or precaching.

Add **@ducanh2912/next-pwa** for a proper service worker:
- Docs: https://ducanh-next-pwa.vercel.app/docs/next-pwa
- App Router compatible; wraps `next.config.ts`. **Must compose with the
  existing `next-intl` plugin** — wrap one inside the other, e.g.
  `export default withPWA(withNextIntl(nextConfig))`.
- Gives: offline app shell, runtime caching strategies, install/update flow.
- Watch: disable in dev, set `dest: "public"`, and confirm the SW scope plays
  well with the `[locale]` routing + middleware.

## Global navigation on every page (single source of control)
Nav is currently **fragmented across four treatments**, so there's no one place
to control it:
- **Landing** (`src/app/[locale]/page.tsx`) — a bespoke inline header (Logo +
  `LanguageSwitcher` + Login).
- **`(app)` group** — `SideNav` (desktop) + `AppHeader` (mobile) + `BottomNav`.
- **admin** — its own header in `admin/layout.tsx`.
- **readiness flow / auth / paywall / legal** — no shared chrome (the readiness
  test has only a one-off "Back to home" link).

Goal: **one global header/nav component, mounted once, present on every page**, so
the language switch (EN/AF), login/account, and primary links are consistent and
controllable from a single place. Approach:
- Extract a shared `GlobalHeader` (Logo, `LanguageSwitcher`, `AuthStatus`/login,
  primary links) and mount it in the root `[locale]/layout.tsx` (or a thin shared
  sub-layout) so it covers landing, readiness, auth, paywall, legal, app, admin.
- Let route groups opt into **variants** (compact vs full, with/without
  `BottomNav`/`SideNav`) via props rather than reimplementing a header each time.
- Keep the language switcher in the global header so EN/AF is reachable on every
  screen (ties into the translation-manager work).

## Translation manager — phase 2: learner content + question bank
Phase 1 ships an admin UI for the **UI-chrome strings** (`messages/{en,af}.json`):
DB-override table `ui_translations` merged over the JSON at request time, live via
`updateTag`, with an AI-draft button — see `src/app/[locale]/admin/translations/`,
`src/lib/translations.ts`, `src/lib/translation-actions.ts`.

Build the **same edit-EN-beside-AF, live-override, AI-draft interface** for the
deferred bilingual *content* pass:
- **Learner content** — sign / rule / control prose (the `road_signs.content`
  JSON and `src/content/{road-rules,vehicle-controls}.ts`) + the **category
  taxonomy labels**.
- **Question bank** — the ~750-question DB4 set (`src/content/readiness-questions.ts`
  now; the wider bank later) — prompt, options, explanation per locale.

Reuse the phase-1 patterns (override storage, `updateTag` invalidation,
`is_admin()` RLS, `llmChat` AI-draft), but expect a **per-domain editor** (multi-
field, per-record) rather than the flat key/value grid — signs/questions have
several translatable fields each. This is the natural next step once phase 1 ships.

## Other deferred items
- **Afrikaans content pass** — translate sign/rule/control prose + the question
  bank + category taxonomy labels (UI chrome is already i18n'd); native review
  of `messages/af.json`.
- **Road-sign library** — full Wikimedia ingest → licence audit → Figma
  normalise → verify vs RTSigns_charts.pdf → wire reviewed SVGs (only 4 demo
  signs wired now). AI-draft the learner content, instructor-review.
- **Auth** — add prod + Vercel preview URLs to Supabase Auth redirect allow-list;
  capture profile fields (locale, is_minor, parent_consent) in a consent flow.
- ~~**Mock exams**~~ — SHIPPED (Code B): entitlement-gated `/mock` → timed
  68-question paper (3 sections scored independently) → summary → grounded AI
  assessment → readiness blend. See `src/lib/exam.ts`, `src/components/exam/*`,
  `scripts/exam/`. Follow-ups below.
- **Full pass-prediction**, parent/school dashboards (post-MVP).
- **POPIA review** before any real learner data → revisit hosting/residency.

## Mock exam — follow-ups (Code B shipped)
- **Payments → entitlements wiring.** The PayFast ITN stub
  (`src/app/api/pay/payfast/route.ts`) and a future Yoco route must insert an
  `entitlements` row (source `payfast`/`yoco`, 90-day expiry, idempotent on the
  payment id) via the service-role client — the same row the admin grant UI
  writes (`src/lib/entitlement-actions.ts`). Needs `SUPABASE_SERVICE_ROLE_KEY`
  set on Vercel.
- **Code A / C papers.** Schema already stores `vehicle_codes` per question and
  the engine filters by code — this is a *content* task: grow the motorcycle/heavy
  pools (currently thin) via the admin question bank, then add `EXAM_FORMAT_A/C`
  constants and a code picker on the start screen.
- **`?next=` auth redirect.** The `/mock` gate sends signed-out users to `/auth`,
  which lands on `/dashboard` after login — it should return them to `/mock`.
- **Question navigator / flag-for-review (v2).** The runner is forward-only; a
  grid navigator + flagging is deferred.
- **DB9 weak-area-improvement component.** The blend currently renormalises over
  mock-avg / topic-accuracy / consistency; the 20% improvement component needs a
  before/after history window (`scoreReadinessBlend` accepts it as `weakImprovement`).
- **Exam-attempt retention (POPIA).** `exam_attempts` stores a minor's answers +
  AI assessment server-side (paid, consented) — define a retention/erase rule
  before production.
- **White-labelling for driving schools.** Offer the platform to schools under
  their own name and domain. Assessed 2026-07-28: **retrofit, do not fork** —
  content stays global, only branding + learner data are tenant-scoped. Phase 0
  (extract `src/lib/brand.ts`, add nullable `tenant_id` to the five learner
  tables) is ~2 days and worth doing early because backfilling that column after
  launch is far more expensive. Phases 1–3 wait for a signed school and must not
  start before the Stage 1 gate. Full plan, schema and gotchas:
  `docs/white-label-plan.md`. Awaiting John's decision.
- **RAG over the legal sources.** Put the Act, the Regulations and the SADC RTSM into a
  queryable store, addressed by citation (`NRTA s1(xlvi)`, `NRTR reg 298A(2)`), so verification
  resolves a citation to verbatim text instead of a 350-page PDF — and, later, so the AI Coach can
  pull grounded supporting material when a learner asks for more. Agreed as direction 2026-07-30,
  **not scheduled**. Two consumers with very different risk: offline verification is safe and useful
  on its own; the learner-facing half cashes in the "future post-test coaching" reservation and
  changes the no-runtime-AI rule, so it needs a deliberate decision first. Extraction is the hard
  part — the RTSM is two-column, the Regulations are a bilingual OCR'd gazette, and neither the Act
  nor the Regulations are consolidated for amendments. Notes, open questions and the reusable
  `wiki-semantic-search` pattern: `docs/rag-source-retrieval.md`.
- **Afrikaans review.** New `mock`/`exam`/`examResult`/`assessment` namespaces in
  `messages/af.json` are first-draft (like the rest); needs native review. The
  AI-generated assessment prose stays English (deferred bilingual content pass).
