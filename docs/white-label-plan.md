# White-labelling K53 Coach — assessment and phased plan

**Status:** proposal, not scheduled. Written 2026-07-28 for a decision after John has slept on it.
**Internal — deliberately not in Linear.** This is a dev-side decision, not a client request. If
Louwrens asks for white-labelling later, this document is the spec the quote is built from, so keep
the phase boundaries in §7 costable and don't let scope blur between them.
**Decision it answers:** do we retrofit white-labelling into this codebase, or duplicate the system
and build a separate white-label product?

**Recommendation: retrofit. Do not fork.** The cheap half is genuinely cheap and worth doing now;
the expensive half should wait until a driving school has actually signed.

---

## 1. The commercial shape being served

K53 Coach stays a direct-to-learner product at `k53coach.co.za`. Alongside it we want to offer the
same platform to driving schools under **their** name and domain — "XYZ Driving School" — so a school
can use it either as a paid product or as a free incentive to win new enrolments.

Two things follow from that, and both were settled in the 2026-07-28 discussion:

1. **We never hold another party's payment credentials.** No school takes card payments under its own
   PayFast merchant account. Either the school buys seats from us, or the school's learners get
   access free. The PayFast integration we have stays exactly as it is — one merchant, ours.
2. **Some tenants need payments and some do not.** A school using the platform as a signup incentive
   has no checkout at all. This is a per-tenant setting, not a second product.

---

## 2. Why not fork

The code is the cheap part. The expensive part is the content pipeline: 362 chart-verified road
signs, a question bank heading to 800 with per-item citations, the accuracy gate (constraint 9), the
sign-verification pipeline, and the pending Afrikaans pass.

Fork the repo and every one of those is maintained twice — or we build a content sync between two
databases, which is strictly harder than multi-tenancy. Worse, the two content sets would drift
silently, and "our content is checked and correct" is the entire pitch.

**The decision rule:** if two tenants would ever need *different content*, forking wins. They never
will — K53 is a single national test. So: one codebase, one content set, many skins.

Corollary that shapes everything below: **content tables stay global.** `road_signs`, `questions`
and `ui_translations` are shared by every tenant and are never tenant-scoped. Only *learner* data and
*branding* are per-tenant. That is what makes this a small job rather than a generic multi-tenant
SaaS rebuild.

---

## 3. Current state — why we are better placed than expected

Measured 2026-07-28, not estimated.

| Thing | State | Consequence |
|---|---|---|
| Hardcoded brand strings | **16 references across 11 app files** (plus 6 in `payfast.test.ts`, which are test fixtures, not brand surface) | Trivially collapsible into one config module |
| Colour palette | **Already fully tokenised** as CSS custom properties in `src/app/globals.css` (`--ink-*`, `--gold-*`, `--surface-*`) | A tenant skin is a token block, not a restyle |
| Logo | **Single component**, `src/components/brand/logo.tsx` | One file to parameterise |
| Copy | **Already externalised** to `messages/{en,af}.json`, namespaced by screen | The i18n layer doubles as per-tenant wording substitution |
| Roles | `user_role` enum **already includes `'school'`** (`init_schema.sql:9`) | No enum migration needed for a school console |
| Access gate | `requireEntitledUser()` (`src/lib/exam-guard.ts`) asks only *"is there an active entitlement?"* | How access was granted is already abstracted away — see §4 |
| Request pipeline | `src/proxy.ts` already runs per-request, composing intl + Supabase session | Natural home for hostname → tenant resolution |
| Learner tables | 5 tables, own-row RLS via `auth.uid()` | Tenant scoping is additive, not a rewrite |

Nothing about the current architecture fights this. The brand surface is small because it was built
behind tokens and components from the start.

---

## 4. Access modes — how payments-vs-no-payments resolves

This looked like the hard part and is actually the easiest, because the right abstraction already
exists. Every gated surface calls `requireEntitledUser()`, which asks one question: does this user
have a live row in `entitlements`? It does not care how that row was created.

So the three commercial models are three ways of creating the same row:

| `access_mode` | How a learner gets access | Checkout UI | `entitlements.source` |
|---|---|---|---|
| `self_pay` | Learner pays R179 via PayFast — today's behaviour | shown | `payfast` |
| `sponsored` | School has bought seats; learner redeems a code or sits on a roster | hidden | `school_seat` *(new)* |
| `open` | Every account at this tenant has access; no payment, no codes | hidden | `tenant_open` *(new)* |

**The paywall is the only place that branches.** No learner-facing screen, no exam surface and no
progress view changes. `entitlements.source` currently has a CHECK constraint of
`('admin','payfast','yoco')` — it gains two values.

**Blocking detail:** `NEXT_PUBLIC_PAYFAST_CHECKOUT_ENABLED` is currently a **global** environment
flag, read in three places (`src/app/api/pay/payfast/checkout/route.ts:22`,
`src/app/[locale]/paywall/page.tsx:18`, and documented at `entitlement-actions.ts:54`). In a
multi-tenant world it must become a per-tenant setting, or opening checkout for one school opens it
for everyone including production K53 Coach. This is the single thing that must change before any
second tenant exists.

---

## 5. How a tenant is identified

**One Vercel project, many domains.** There is no deploy-per-school — Vercel attaches multiple
domains to one project natively.

1. The school's domain (`xyzdriving.co.za`) or a subdomain (`xyz.k53coach.co.za`) points at the
   existing Vercel project.
2. `src/proxy.ts` resolves the request hostname to a tenant and attaches it to the request.
3. The root layout (`src/app/[locale]/layout.tsx`) reads it and injects that tenant's palette tokens,
   logo and display name.
4. An unrecognised host falls back to the default K53 Coach tenant.

Adding a school then becomes **insert a row, attach a domain** — no code change, no redeploy.

### Proposed `tenants` table

| Column | Purpose |
|---|---|
| `id` | PK |
| `slug` | stable identifier, used in codes and admin |
| `hostname` | unique; the resolution key |
| `display_name` | "XYZ Driving School" |
| `logo_url` / `logo_text` | brand mark |
| `theme` | jsonb — the CSS custom-property overrides |
| `access_mode` | `self_pay` \| `sponsored` \| `open` (see §4) |
| `checkout_enabled` | replaces the global env flag, per tenant |
| `default_locale` | `en` \| `af` |
| `support_email` | shown in footer / transactional mail |

---

## 6. Schema changes to learner data

Five tables gain a nullable `tenant_id` referencing `tenants(id)`. **Null means the default public
K53 Coach tenant**, so every existing row stays valid and nothing needs backfilling later.

- `profiles`
- `attempts`
- `readiness_results`
- `entitlements`
- `exam_attempts`

RLS on these is currently simple own-row (`auth.uid() = user_id`). Own-row access **does not change**.
What gets added later is a *school-admin* read path: a school user may read rows whose `tenant_id`
matches their own. That is additive — no existing policy is rewritten, which is why this is a small
migration rather than a dangerous one.

> **Do this early even if nothing else happens.** Adding a nullable column to near-empty tables costs
> nothing today (`exam_attempts` is at 0 rows, `entitlements` at 6). Backfilling `tenant_id` across
> live learner data after launch is a migration nobody wants to write.

---

## 7. Phasing

### Phase 0 — Brand extraction + tenant column *(~2 days, do first)*

Low risk, no behaviour change, improves the codebase whether or not white-labelling ever ships.

1. Create `src/lib/brand.ts` — display name, domain, support email, logo mark/wordmark, OG defaults.
2. Point the 16 references at it: `logo.tsx`, `manifest.ts`, `layout.tsx`, `page.tsx`,
   `readiness/result/page.tsx`, `quiz-demo.tsx`, `admin/guide/page.tsx`, `types.ts`, `globals.css`,
   `messages/{en,af}.json`.
3. Isolate the brand palette in `globals.css` into a clearly-marked swappable token block, separate
   from the semantic tokens that must not move.
4. Migration: `tenants` table + nullable `tenant_id` on the five learner tables. **No resolution
   logic yet** — the column exists and stays null.
5. Regenerate `database.types.ts`.

**Exit:** the first school that signs can be skinned in an afternoon.

### Phase 1 — Tier 1, branded tenancy *(~1 week)*

Real per-request branding. One deploy, many domains.

1. Hostname → tenant resolution in `proxy.ts`; tenant on the request.
2. Root layout injects tenant tokens, name and logo; unknown host falls back to K53 Coach.
3. Move `checkout_enabled` off the global env flag onto the tenant.
4. Implement `access_mode` in the paywall; extend the `entitlements.source` CHECK constraint.
5. Set `tenant_id` on signup from the resolving host.
6. Per-domain magic-link redirect URLs whitelisted in `supabase/config.toml`.

**Exit:** a school can be live on its own domain, in `open` or `self_pay` mode, with no code change.

### Phase 2 — School console *(sizeable — this is new product, not a retrofit)*

1. School-admin RLS path (tenant-scoped reads on the five learner tables).
2. Roster view: enrolled learners, readiness scores, mock results.
3. Seat allocation and redemption codes for `sponsored` mode.
4. School onboarding / invite flow.

Deliberately deferred until a school has signed. Scope it against a real customer, not a guess.

### Phase 3 — Seat billing *(only if the channel proves out)*

Invoicing schools for seat bundles, seat-usage reporting, renewals. Manual invoicing is fine for the
first several schools; do not build this speculatively.

---

## 8. Known gotchas

- **Supabase auth is one user pool.** A learner signing up at `xyzdriving.co.za` and at
  `k53coach.co.za` with the same email is the *same* auth user. Proposed rule: `profiles.tenant_id`
  is set at signup and one account belongs to one tenant. Decide this deliberately — discovering it
  later is painful.
- **Every new school domain needs its magic-link redirect URL whitelisted** in
  `supabase/config.toml` and pushed with `supabase-go config push`. Note that push syncs the *whole*
  file, not just the edit. This is a per-school operational step and belongs in a runbook.
- **`sa_relevant` / approval gates are global.** A tenant cannot have its own approved content set,
  by design (§2). If a school ever asks for custom content, that is a product conversation, not a
  config change.
- **Do not tenant-scope `road_signs`, `questions` or `ui_translations`.** They are the moat and they
  are shared.
- **PWA manifest is per-tenant.** `src/app/manifest.ts` is currently static; under Phase 1 it must
  vary by host or every school's installed app says "K53 Coach".
- **The dark marketing zone vs white app rule still applies** per tenant — a school skin must supply
  both, or the landing page and the app will disagree.

---

## 9. Relationship to the launch gate

**White-labelling moves neither half of the Stage 1 gate** (300 verified questions + payments live,
K53-32). Phase 0 is small enough not to compete with it. Phases 1–3 are, and should not start until
Stage 1 is real.

One genuinely interesting consequence worth naming: an `open` tenant puts the product in front of
real learners **without opening checkout**, which the Stage 1 gate currently forbids. A driving-school
pilot could technically run before the content floor is met.

Treat that carefully. The gate exists for content quality, not only for money. Free access does not
protect us if a school's learners hit thin content — and they would be our first real audience. If a
pilot is wanted early, the content floor and the claims audit (`docs/claims-audit.md`) should be
honest first.

---

## 10. Open questions for John

1. **One account per tenant, or one account across tenants?** (§8). Recommendation: one tenant per
   account, set at signup.
2. **Subdomains (`xyz.k53coach.co.za`) or the school's own domain?** Own domains look better and cost
   an operational step each (DNS + auth whitelist). Recommendation: support both, default to
   subdomain for pilots.
3. **Does a school in `sponsored` mode allocate seats itself, or do we?** Decides whether Phase 2's
   console is needed at first sale or can be deferred to admin-side.
*(Settled 2026-07-28: this stays out of Linear. It is a dev-side decision, not a client request. The
K53 workspace is visible to Louwrens, and if he asks for the feature later this document becomes the
spec the quote is built from — see the header note.)*

---

## Non-goals

- Per-tenant content, question banks or sign sets.
- Per-tenant payment credentials or split payments.
- Reselling / agency tiers.
- Any Phase 2+ work before a signed school.
