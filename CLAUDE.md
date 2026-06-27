# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Pre-code, planning stage. The repo currently contains **only specification documents** in `init/` — there is no source code, build system, package manager, tests, or git repository yet. When asked to "build", "scaffold", or "start" anything, the first task is to stand up the project from these specs rather than modify existing code.

Read these in `init/` before acting (`notes.md` is currently empty):
- `PRD.md` — the canonical v1.0 product requirements (features, content databases, pricing, KPIs, MVP deliverables).
- `PRD-additions.md` — **strategic corrections that override the PRD** where they conflict. Read this second; it changes the business model and MVP scope.
- `k53-ai-coach-executive-overview.md` — long-form rationale, AI architecture, content-rights strategy, POPIA detail, source references.
- `k53-ai-coach-short-executive-concept.md` — one-page summary.

## What the product is

K53 AI Coach: a Progressive Web App (PWA) helping South African learner drivers pass the K53 Learner's Licence test (Phase 1) and later the practical driving test (Phase 2). The differentiator is an AI tutor layer over verified K53 content — it explains *why* an answer is wrong, tracks weak areas, and produces a parent-readable readiness score. It is explicitly **not** "another quiz app".

## Planned technical architecture (from PRD §Technical Architecture)

- Frontend: Nextjs + Supabase + Tailwind, built as a PWA (QR-code entry, add-to-home-screen, no app-store dependency for MVP).
- Backend / DB / Auth: Supabase + PostgreSQL + Supabase Auth.
- AI: OpenAI API — but used as a **retrieval-grounded tutor over verified content, never as the source of truth** (verified DB → retrieval layer → LLM explanation → guardrails against unsupported answers → logging of uncertain answers for human review).
- Hosting: Vercel.
- Payments: PayFast + Yoco (South African gateways; direct checkout, not app-store IAP).

When scaffolding, prefer the latest Claude models over OpenAI for any AI layer work unless a spec explicitly requires OpenAI — see the user's global instructions and the `claude-api` skill.

## Non-obvious constraints that shape implementation

These are easy to miss and have architectural consequences. Honor them in any design or code.

1. **POPIA-first infrastructure (PRD-additions §7).** Supabase Cloud and Vercel are acceptable **only for prototype work with dummy/anonymised data**. They are NOT approved for production learner/parent/school data until a POPIA review is done. Production must consider SA data residency, cross-border transfer, operator agreements, retention rules. Do not wire real personal data into hosted services without flagging this.

2. **No biometric storage, ever (PRD-additions §4, overview §10).** Anti-account-sharing uses device-native passkeys / WebAuthn / Face ID / Touch ID handled *by the device*. The app never collects or stores fingerprints, face scans, or biometric identifiers. Model: one primary device per account, re-auth only on suspicious/new-device usage. Never interrupt a live mock exam with an auth prompt.

3. **Under-18 users are expected (overview §11).** Target market includes Grade 11/12 learners. Allow a free anonymous demo test; require parent/guardian consent before saving a minor's personal progress; keep the payment screen parent-facing; collect minimal PII.

4. **Content is the moat, not the code (overview §12, PRD-additions §3).** Do NOT scrape/copy competitor apps, screenshots, or paid manuals. **Sign-sourcing strategy (updated, overrides the "redraw everything" reading of PRD-additions §3):** the SADC/SA official road signs on Wikimedia Commons are Public Domain under SA Copyright Act §12(8)(a) and may be used commercially — so source sign SVGs from Wikimedia rather than redrawing or AI-inventing them. BUT Commons licences are **per file**: every SVG must be licence-audited individually and verified against the official DoT chart (`RTSigns_charts.pdf`), then stored with an `AssetProvenance` record (`src/lib/types.ts`). The real moat is the **original learning content** — plain-English explanations, behaviour, common mistakes, test hints, and questions (AI-drafted → human-reviewed) — NOT the glyph. See `docs/road-sign-assets.md` for the full pipeline. Each road sign is a structured learning object (overview §12.2). Note: `src/components/signs/` currently holds original-redraw **placeholder** glyphs until audited Wikimedia SVGs land in `public/signs/`. Each sign has two independent gates: `provenance.assetStatus` (SVG licence/verification) and `reviewStatus` (content accuracy) — both must be `approved` to ship.

5. **Pricing model is once-off, not subscription (PRD-additions §1 & §6, overview §7).** The model is R149–R199 once-off for 90 days full access, then optional R20/month for continued AI Coach access only. Schools: R99/learner/90 days. The R20/month covers AI inference cost — it is not a subscription trap. KPIs are framed around free-test→paid-unlock conversion and parent share rate, **not** "subscription conversion" (the PRD's original wording is superseded).

6. **MVP scope is narrower than the PRD's full Phase 1 (PRD-additions §5, overview §14).** The MVP must prove the business (learners use it, parents pay, schools work as a channel, AI explanations add value) before building full dashboards, full pass-prediction, practical driving coach, voice tutor, or photo/video recognition. When tempted to implement the PRD's full feature list, defer anything in the "MVP Should Not Include Yet" list (overview §14).

## Roles & data model anchors

User roles: Learner, Parent, School, Admin. The PRD references numbered "Databases" (content libraries + engines) — these are logical data/content domains, not literal table names: road signs (DB1), road rules (DB2), vehicle controls (DB3), questions+explanations (DB4, ~750 Q), AI coaching cards (DB5), exam generator (DB6), analytics/prediction (DB7), readiness scoring (DB9 — 40% mock avg / 25% topic accuracy / 20% weak-area improvement / 15% consistency), dashboards (DB10), legal docs (DB12).
