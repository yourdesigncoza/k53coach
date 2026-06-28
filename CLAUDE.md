# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What the product is

K53 AI Coach: a Progressive Web App helping South African learner drivers pass the K53 Learner's Licence test (Phase 1) and later the practical driving test (Phase 2). The differentiator is an AI tutor layer over verified K53 content — it explains *why* an answer is wrong, tracks weak areas, and produces a parent-readable readiness score. It is explicitly **not** "another quiz app".

The original specs live in `init/` and still govern product intent — read them before product/scope decisions (`PRD.md`, then `PRD-additions.md` which **overrides** it, plus the two executive overviews). `docs/backlog.md` tracks deferred work.

## Project status

Live MVP slice, deployed. Built: free anonymous readiness test → parent-shareable score → paywall (PayFast/Yoco stubs) → app shell; three learner modules (Road Signs, Rules, Vehicle Controls) each with list + structured-learning-object detail + an AI "Explain my mistake" practice mode; bilingual EN/AF; Supabase-backed for signed-in learners. The road-sign library (DB1) is fully ingested and **chart-verified in a Claude Code session** (245/254 in-chart signs auto-approved with drafted content; the rest in the admin exceptions queue) — see `docs/sign-accuracy-pipeline.md`. Deferred (see `docs/backlog.md`): mock exams, full pass-prediction, dashboards, practical-driving coach, the Afrikaans content pass, next-pwa service worker.

- **Production:** https://k53coach.vercel.app (Vercel project `yourdesigncozas-projects/k53coach`; GitHub `yourdesigncoza/k53coach` auto-deploys on push).
- **Supabase (prototype):** project `k53coach`, ref `lxefjksaxmiawrnnewmj`, eu-west-1.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build (Turbopack)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit

# Road-sign ingest (needs pdftotext + network; see scripts/signs/README.md)
npm run signs:ingest   # PDF extract -> Wikimedia fetch + provenance

# Supabase (CLI is split: `supabase` + `supabase-go`, both in ~/.local/bin)
supabase db push                 # apply migrations in supabase/migrations to remote
supabase migration new <name>    # new timestamped migration
supabase config push             # push supabase/config.toml (incl auth URLs) to remote
supabase gen types typescript --linked > src/lib/database.types.ts

vercel --prod        # deploy to production (prod env vars already set on Vercel)
```

No test framework is set up yet. The app runs **without Supabase env vars** ("demo mode" — auth/persistence simulated); real keys live in `.env.local` (gitignored). Network here is IPv4-only, so Supabase DB commands use the pooler (this is why `supabase link` was re-run).

## Technical architecture (as built)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (**Base UI** primitives) · Supabase (Postgres + Auth, SSR) · Vercel.

These are the cross-cutting rules that aren't obvious from a single file:

- **Locale routing owns the route tree.** Every page lives under `src/app/[locale]/` (`en`/`af`). `app/[locale]/layout.tsx` is the *root* layout (`<html lang>`, `NextIntlClientProvider`, theme, fonts) — there is no `app/layout.tsx`. Only `app/api/`, `app/manifest.ts`, `app/globals.css`, `app/favicon.ico` sit outside `[locale]`.
- **Always import navigation from `@/i18n/navigation`** (`Link`, `useRouter`, `usePathname`, `redirect`) — never `next/link` or `next/navigation` for those, or the active locale is dropped. `notFound`, `generateStaticParams`, `generateMetadata` still come from `next`.
- **i18n strings** live in `messages/{en,af}.json`, namespaced by screen (`nav`, `landing`, `readiness`, `module`, …). Use `useTranslations` in client + sync server components, `getTranslations` (awaited) in async server components. Add a language: extend `src/i18n/routing.ts` + add `messages/<locale>.json`. Config: `src/i18n/{routing,request,navigation}.ts`. `messages/af.json` is a first-pass draft pending native review.
- **UI chrome is translated; content + category labels are NOT yet.** Learner content (signs/rules/controls prose, questions in `src/content/*.ts`) and the category taxonomy labels (in the content meta) are still English — that's the deferred bilingual content pass.
- **Supabase clients degrade gracefully.** `src/lib/supabase/{client,server,middleware}.ts` return `null` when env vars are absent (demo mode). All are typed via `src/lib/database.types.ts` (regenerate after schema changes). Server-side reads live in `src/lib/supabase/queries.ts`. Persistence (attempts, readiness snapshots) happens client-side via the browser client, guarded by an auth check; **RLS** enforces own-row access on every table.
- **`src/proxy.ts` is the middleware** (Next 16 renamed `middleware`→`proxy`). It composes the next-intl locale middleware with Supabase session refresh — order matters (intl builds the response, Supabase writes cookies onto it).
- **All app LLM calls go through `src/lib/llm.ts` (OpenAI `gpt-4o-mini`, `OPENAI_API_KEY`).** One entry point (`llmChat` + `hasLlmKey`), direct fetch, graceful when the key is absent. Use it for any new AI feature — do not call a provider API directly or hardcode a model.
- **AI tutor is retrieval-grounded.** `src/app/api/ai/explain/route.ts` returns *verified* question/sign content as the guaranteed answer; the LLM (`@/lib/llm`) only **rephrases** that grounding into a friendlier explanation and falls back to the verified text on any failure — it must never invent legal/safety claims. `src/app/api/admin/draft-sign/route.ts` (the admin "AI draft" button) drafts the 5 content fields as a human-reviewed starting point.
- **Content as structured learning objects.** `src/content/{road-rules,vehicle-controls,readiness-questions}.ts` are typed data (`src/lib/types.ts`). **Road signs are DB-backed, not a TS file** — the `road_signs` table (397 rows) holds artwork + provenance + bilingual `content` + verification evidence; learner pages read it via `getApprovedSigns*` (served set = both gates approved + `sa_relevant`), admin via `getSigns`. Signs render via `SignImage` from the real PD SADC SVG in `public/signs/<code>.svg` (`svg_file`). Verification against the official chart is automated in a Claude Code session — see `docs/sign-accuracy-pipeline.md` + `scripts/signs/`.
- **Theme is clean neutral (Catalyst-style), no brand colour.** Tokens in `src/app/globals.css` (ink primary, zinc neutrals, single blue accent); semantic green/amber/red only as soft readiness-badge tints. Mobile-first: `[locale]/(app)` uses a bottom tab bar on mobile and a left sidebar on `md+`. Base UI components use a `render` prop for polymorphism (not Radix `asChild`).
- After schema changes: edit/add a migration in `supabase/migrations/`, `supabase db push`, then regenerate `database.types.ts`. Remote auth/config is code in `supabase/config.toml` (push with `supabase config push` — note it syncs the *whole* file, not just your edit).

## Non-obvious constraints that shape implementation

These are easy to miss and have architectural consequences. Honor them in any design or code.

1. **POPIA-first infrastructure (PRD-additions §7).** Supabase Cloud and Vercel are acceptable **only for prototype work with dummy/anonymised data**. They are NOT approved for production learner/parent/school data until a POPIA review is done. Production must consider SA data residency, cross-border transfer, operator agreements, retention rules. Do not wire real personal data into hosted services without flagging this. The current Supabase project is a prototype on this basis.

2. **No biometric storage, ever (PRD-additions §4, overview §10).** Anti-account-sharing uses device-native passkeys / WebAuthn / Face ID / Touch ID handled *by the device*. The app never collects or stores fingerprints, face scans, or biometric identifiers. Model: one primary device per account, re-auth only on suspicious/new-device usage. Never interrupt a live mock exam with an auth prompt.

3. **Under-18 users are expected (overview §11).** Target market includes Grade 11/12 learners. The free readiness test is anonymous (sessionStorage only); require parent/guardian consent before saving a minor's personal progress; keep the payment screen parent-facing; collect minimal PII.

4. **Content is the moat, not the code (overview §12, PRD-additions §3).** Do NOT scrape/copy competitor apps, screenshots, or paid manuals. **Sign-sourcing strategy (overrides the "redraw everything" reading of PRD-additions §3):** the SADC/SA official road signs on Wikimedia Commons are Public Domain under SA Copyright Act §12(8)(a) and may be used commercially — source sign SVGs from Wikimedia rather than redrawing or AI-inventing them. BUT Commons licences are **per file**: every SVG must be licence-audited individually and verified against the official DoT chart (`init/RTSigns_charts.pdf`), then stored with an `AssetProvenance` record (`src/lib/types.ts`). The real moat is the **original learning content** — plain-English explanations, behaviour, common mistakes, test hints, and questions (AI-drafted → AI-verified vs the chart → human exceptions only) — NOT the glyph. Verification is **automated in a Claude Code session** against the chart ground truth (vision + semantic + content-factuality), recorded auditably (`approved_by`, `verification`, `svg_hash`, `verified_at`); only uncertain signs reach a human. See `docs/sign-accuracy-pipeline.md` (execution plan) and `docs/road-sign-assets.md` (overview), scripts in `scripts/signs/`. Each `road_signs` row has two independent gates — `asset_status` (SVG licence/chart-verification) and `review_status` (content accuracy) — plus `sa_relevant`; all three gate the served set.

5. **Pricing model is once-off, not subscription (PRD-additions §1 & §6, overview §7).** R149–R199 once-off for 90 days full access, then optional R20/month for continued AI Coach access only. Schools: R99/learner/90 days. The R20/month covers AI inference cost — it is not a subscription trap. KPIs are framed around free-test→paid-unlock conversion and parent share rate, **not** "subscription conversion" (the PRD's original wording is superseded).

6. **MVP scope is narrower than the PRD's full Phase 1 (PRD-additions §5, overview §14).** The MVP must prove the business (learners use it, parents pay, schools work as a channel, AI explanations add value) before building full dashboards, full pass-prediction, practical driving coach, voice tutor, or photo/video recognition. Defer anything in the "MVP Should Not Include Yet" list (overview §14).

## Roles & data model anchors

User roles: Learner, Parent, School, Admin. The PRD's numbered "Databases" are logical content/engine domains, not literal tables: road signs (DB1), road rules (DB2), vehicle controls (DB3), questions+explanations (DB4, ~750 Q), AI coaching cards (DB5), exam generator (DB6), analytics/prediction (DB7), readiness scoring (DB9 — 40% mock avg / 25% topic accuracy / 20% weak-area improvement / 15% consistency), dashboards (DB10), legal docs (DB12).

Implemented Postgres tables (RLS, own-row policies): `profiles` (auto-created on signup; role/locale/consent flags, minimal PII), `attempts` (per-question, feeds DB7), `readiness_results` (DB9 snapshots). The readiness scoring helper is `src/lib/readiness.ts`.
