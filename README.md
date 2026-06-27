# K53 AI Coach

Learn. Practice. Pass. A mobile-first PWA that helps South African learner
drivers pass the K53 learner's licence — an AI tutor over **verified** content
that explains mistakes and shows a parent-readable readiness score.

> Product specs live in [`init/`](init/). Architecture & non-obvious
> constraints (POPIA, no biometrics, content moat, pricing) are in
> [`CLAUDE.md`](CLAUDE.md). Read those before making product decisions.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives) — "friendly &
  motivating" theme, mobile-first, PWA (installable, offline-ready shell)
- **Supabase** (Postgres + Auth, SSR) — degrades to demo mode without env keys
- **Vercel** hosting · **PayFast / Yoco** payments (direct checkout)

## Develop

```bash
npm install
cp .env.example .env.local   # optional — app runs in demo mode without it
npm run dev                  # http://localhost:3000

npm run build                # production build
npm run typecheck            # tsc --noEmit
npm run lint
```

The app runs fully without Supabase configured (auth/paywall are simulated).
Add Supabase keys to `.env.local` to enable real auth.

## What's built (MVP slice)

End-to-end: QR landing → free anonymous readiness test → parent-shareable score
→ paywall → app shell (dashboard, Road Signs module with detail pages, progress)
→ passkey-ready auth. Rules, Vehicle Controls, mock exams, and dashboards are
deliberately stubbed (`MVP Should Not Include Yet`, overview §14).

## Road-sign content pipeline

Signs are sourced from the Public-Domain SADC/SA set on Wikimedia Commons
(licence-audited per file, verified against the official DoT chart), not
redrawn or AI-invented. The original learner content (explanations, questions)
is the moat.

```bash
npm run signs:ingest   # PDF extract → Wikimedia fetch (see scripts/signs/README.md)
```

Details + licensing rationale: [`docs/road-sign-assets.md`](docs/road-sign-assets.md).

## Key paths

| Path | What |
|------|------|
| `src/app/` | Routes (App Router). `(app)/` = authed shell with bottom nav |
| `src/components/ui/` | shadcn/ui primitives |
| `src/components/signs/` | Original-redraw placeholder glyphs (until PD SVGs reviewed) |
| `src/content/` | Sample road signs + readiness questions |
| `src/lib/readiness.ts` | Readiness scoring (DB9) |
| `src/lib/supabase/` | Browser/server/proxy clients |
| `scripts/signs/` | PDF → Wikimedia sign ingest |
