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

## Other deferred items
- **Afrikaans content pass** — translate sign/rule/control prose + the question
  bank + category taxonomy labels (UI chrome is already i18n'd); native review
  of `messages/af.json`.
- **Road-sign library** — full Wikimedia ingest → licence audit → Figma
  normalise → verify vs RTSigns_charts.pdf → wire reviewed SVGs (only 4 demo
  signs wired now). AI-draft the learner content, instructor-review.
- **Auth** — add prod + Vercel preview URLs to Supabase Auth redirect allow-list;
  capture profile fields (locale, is_minor, parent_consent) in a consent flow.
- **Mock exams**, full pass-prediction, parent/school dashboards (post-MVP).
- **POPIA review** before any real learner data → revisit hosting/residency.
