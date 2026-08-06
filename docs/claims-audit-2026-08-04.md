# Claims audit — 2026-08-04

**Gate:** Stage 1, W6 "Every claim true" (`docs/build-plan-2026-07.md` §5).
**Scope:** every learner- and parent-facing string in `messages/{en,af}.json` — landing page,
paywall, privacy page, readiness result, module chrome. 32 keys corrected across both locales.

Every claim below was tested against the live database or the code that implements it, on
2026-08-04. **Re-measure before quoting any number here** — the signs count moved by 47 in three
days once already.

---

## Method

For each claim, find the thing that would make it true, and read it:

| Claim about | Checked against |
|---|---|
| Counts of signs / questions | PostgREST against the prototype project, with the same filters the learner getters use |
| A feature existing | The symbol that implements it, and its call sites |
| A feature being paid | `requireEntitledUser` call sites — the only real gate |
| Verification / provenance | `road_signs.verification`, `questions.source_citation`, `approved_by` |

A claim with nothing behind it is a defect regardless of intent.

---

## Findings

Severity is about who is misled and at what moment. **The payment screen ranks above the landing
page**, because a parent reads it with a card in hand.

### 🔴 P1 — false statements on the payment screen

| Key | Was | Reality |
|---|---|---|
| `paywall.incl1` | "Full **750-question** bank + mock exams" | **274 approved questions.** Off by 476 on the screen where money changes hands. **Restored 2026-08-04 at John's request as a forward-looking claim** — "from a bank growing to 750+" — see below |
| `paywall.incl3` | "**AI explanations** for every wrong answer" | Explanations are pre-written verified content. There is **no runtime AI in the learner flow** — that is a deliberate architecture decision (`CLAUDE.md`), not a gap |
| `paywall.incl2` | "**Complete** road-sign, rules & controls library" | Rules are 29 lessons of a syllabus still being written (K53-31); "complete" is not available to claim |
| `paywall.incl4` | "**Adaptive** weak-area study plan" | `weak-area-cards.ts` surfaces weak topics. Nothing adapts |
| `paywall.subtitle` | "Optional **R20/month** afterwards" | No subscription billing exists anywhere in the codebase |
| `paywall.stub` | "{gateway} checkout is **stubbed in the MVP scaffold**" | PayFast has been live and ITN-verified since 2026-08-03. Stale, and it undersells a working integration |

### 🔴 P1 — false statements on the privacy page

| Key | Was | Reality |
|---|---|---|
| `legal.p3` | "For learners under 18, a parent or guardian **must consent** before we save personal progress" | **Not built.** `profiles.is_minor` and `profiles.parent_consent` exist as columns; **nothing in `src/` reads or writes either.** No consent is ever requested. Same claim also sat in `landing.faqA3` |
| `legal.p5` | "Production data is handled POPIA-first: **SA data residency**…" | Supabase project `lxefjksaxmiawrnnewmj` is **eu-west-1 (Ireland)**. Not SA residency |

`legal.p3` is the most serious finding in the audit: it is a privacy promise, made to parents, about
minors, that the software does not keep. Corrected to describe what actually happens (the free
result is device-local, per constraint 3). **Parent Consent stays listed in `legal.docs` as a
required production document** — that list is honest precisely because it describes work not yet done.

### 🟠 P2 — overstated or contradictory on the landing page

| Key | Was | Reality |
|---|---|---|
| `landing.cred2Title` | "**360+** road signs" | **356 served** — 340 signs + 16 markings |
| `landing.cred1Body` | "**Every** sign checked against the official DoT chart" | 350 of 356 carry recorded verification evidence. **6 do not** — see below |
| `landing.faqA1` | "matched to the official K53 **learner's manual**" | 232 of 274 approved questions carry a `source_citation`; **42 carry none**. Also the wrong provenance — prose is drafted from the Act, the regulations and the chart (constraint 7) |
| `landing.faqA4`, `feat4Body` | "**installs as an app** on your phone" | There is **no service worker** (`next-pwa` is deferred in `docs/backlog.md`). iOS Add-to-Home-Screen works; **Android Chrome will not offer to install**, so for most SA users the claim fails |
| `landing.ctaNote`, `trust3` | "Takes about **5 minutes**" | The readiness test is **5 questions** (`READINESS_QUESTION_COUNT`). Directly contradicted `ctaBandTitle` — "5 questions. 30 seconds." — on the same page. Stale from when the test was 15 |
| `landing.faqA2`, `pricingBody`, `pricingNote*` | "R20/month … cancel anytime" | No subscription billing exists |
| `landing.demoSub` | "see the **AI Coach** explanation appear" | The demo shows stored prose. Describing it as AI output misrepresents the one thing we most need to be trusted on |
| `landing.freeF2` | "**Sample** practice questions" | **Understated.** Only `/mock` is gated (`requireEntitledUser`, 3 call sites). All practice, all explanations and the whole library are already free |
| `landing.step1Body` | "**Scan the QR code** or tap the button" | No QR code is rendered anywhere in `src/` |
| `landing.faqA5` | "Yes. The app interface is bilingual" | True but incomplete. Build plan §4 W6 **requires** marketing to say Stage 1 questions are English-only |
| `result.ctaBody` | "90 days of full practice + **AI explanations**" | Practice is free; explanations are not AI |
| `module.practice` | "Practice with **AI Coach**" | No AI in practice mode |

### 🟢 Checked and true — left alone

- `landing.cred2Body` "Licence-audited artwork with source provenance" — `AssetProvenance` is recorded per row.
- `landing.cred3Body` "Afrikaans learning content is on the way" — already honest.
- `landing.cred4Body` / `auth.passkeyToast` — no biometrics, ever (constraint 2). True, and structurally guaranteed.
- `examResult.viewAssessment`, `assessment.*` — "AI Assessment" is **accurate**. `POST /api/exam/assess` calls `llmChat`. This is the single genuine runtime-AI touchpoint, which is why the AI positioning survives the audit.
- `landing.pricingHeadEmph` "No subscription trap" — now more true than before, not less.
- `planF3`/`planF4`, `freeF1`/`freeF3`, FAQ 4's device claim — verified.

---

## 750 is back, as a target rather than a count

John asked for the number restored on 2026-08-04: *"we will reach this and more."* It now reads
**"from a bank growing to 750+"** rather than the original **"Full 750-question bank"**.

The distinction is the whole audit in one line. *"Full 750-question bank"* is a present-tense
statement of what the buyer receives, and it is false by 476 on the screen where they enter card
details — the kind of misrepresentation the Consumer Protection Act exists for. *"Growing to 750+"*
is a statement of intent, it is true, and it is backed: 750 is the DB4 target in `docs/product/PRD.md`
and Stage 2 of `docs/build-plan-2026-07.md`.

**If the number changes, this string is wrong the same day** — it is the second of two hard numbers
in the copy, alongside `landing.cred2Title`.

## The price is interpolated, not written into the copy

Three strings quoted `R179` as a literal — `landing.faqA2`, `result.ctaBody` and
`paywall.subtitle`. They now carry `{price}` and the render sites pass
`ENTITLEMENT_PRICE_LABEL` from `src/lib/pricing.ts`.

This matters for a claims audit specifically: a literal price in a translation file is a claim
that **cannot be corrected by changing the constant**, so raising the price would leave two
locales advertising the old one — false, on the payment screen, in the most consequential
possible way. `src/lib/pricing.ts` is the single source of truth; copy must interpolate from it.

`landing.schools` and `landing.pricingSchoolsRest` still hardcode **R99**, because there is no
schools constant in `pricing.ts` to point at. Same defect class, not fixed here — adding a
constant would imply a schools offering exists to be priced.

## Two things the audit could not fix in copy

These need a decision, not a wording change.

### 1. Six served signs carry no verification evidence

`asset_status = 'approved'`, `approved_by = 'human:admin'`, `verification` empty:

`IN11.1`, `IN11.2`, `IN11.3`, `IN11.4` (supplementary plates), `W346` (emergency flashing light), `IN19` (modal transfer).

They are serving to learners today. The copy no longer says "every", which makes the page honest —
but the underlying gap is real and belongs on `docs/verification-worklist.md`. Either verify them
against `resources/charts/RTSigns_charts.pdf` or withdraw them; do not leave the claim resting on
the softened wording.

### 2. The free/paid split does not match the pricing card — and copy is the wrong place to fix it

Only `/mock` is gated. Practice, explanations, the full sign/rules/controls library and progress
tracking are **already free to anonymous users**. So R179 currently buys mock exams and the AI
assessment, and nothing else.

Two valid resolutions, and they point opposite ways:

- **The copy is wrong** — the free tier really is that generous, and the paid tier should be sold on
  mock exams + AI assessment. (What this audit assumed, minimally: `freeF2` corrected upward,
  `planF1`/`planF2` now name what is genuinely gated.)
- **The gating is wrong** — the intent was always that paid unlocks the app, and `requireEntitledUser`
  was simply never extended past `/mock`.

**This is John's call, not a copy fix.** The current wording is true under either resolution, which is
why it was safe to ship ahead of the decision — but if the answer is "gating is wrong", the pricing
card should be revisited at the same time.

✅ **Settled 2026-08-06: leave it open. Do not gate practice, and do not raise this
proactively — surface it only if Louwrens asks.** So the first resolution stands: the
free tier really is that generous, and the paid tier is sold on mock exams plus the AI
assessment. Two consequences worth knowing rather than rediscovering:

- **The whole bank is anonymously scrapable.** One unauthenticated request to
  `/en/learn/rules/practice` returns all 120 approved rules questions **with their
  verified explanations** in the page payload; signs and controls the same. That is the
  moat (constraint 4) served to a `curl`. Accepted, not overlooked.
- **The paid tier got thinner the same day**, when AP-09 put the AI assessment on the
  free readiness test. R179 previously bought mock exams + the AI assessment; it now
  buys mock exams and a longer version of something available free. That was the
  intended upside — the differentiator reaches every visitor instead of only buyers —
  but it moved the free/paid line, so read the pricing card against it before Stage 1
  marketing goes out.

The options weighed and declined were: sign-in-but-still-free for practice (captures the
account, stops bulk scraping, but pulls minors into account creation and the
parent-consent question), and a free-sample/paid-depth split (which would need
`landing.freeF2` corrected back **down**, having just been corrected upward).

---

## Re-measuring

```bash
set -a && . ./.env.local && set +a
B="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
H=(-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

# signs + markings served (the "356" claim)
curl -s "${H[@]}" "$B/road_signs?select=code&asset_status=eq.approved&review_status=eq.approved&sa_relevant=is.true"

# approved questions (the bank-size claim)
curl -s "${H[@]}" "$B/questions?select=id&review_status=eq.approved"
```

`landing.cred2Title` is the one string carrying a hard number. If the served count moves off 356,
that string is wrong the same day — it is the first thing to check after any signs migration or
artwork audit.
