# Marketing claims audit

**Date:** 2026-07-24 · Launch-bar item (W6, `docs/build-plan-2026-07.md`)

Every public claim checked against what the build actually does. The product is positioned on
being *accurate*; a claim we can't back is the cheapest possible way to undermine that, and it is
the first thing a sceptical parent or a competitor will test.

Re-run this before opening the checkout.

## Corrected

| Claim | Where | Problem | Now reads |
|---|---|---|---|
| "Any device, installable as an app, **works offline**." | `landing.feat4Body` | **False.** No service worker exists and `@ducanh2912/next-pwa` is not a dependency. The manifest *does* exist, so "installable" is true and stays. | "Any device, installable as an app — no app store needed." |
| "Works on any device, **offline**" | `landing.planF4` | Same false claim, second location — on the paid plan card. | "Works on any device" |
| "**Real K53 questions** matched to the latest manual." | `landing.feat2Body` | **Misleading.** SA does not publish its exam papers. Ours are original, written from the legislation and the official chart. "Real" implies actual exam questions. | "Exam-style questions written from the official material." |
| "English & Afrikaans — Learn in the language you think in." | `landing.cred3Body` | **Misleading.** UI chrome is bilingual; learner content (sign/rule/control prose and the whole question bank) is English-only. An Afrikaans learner does not currently learn in Afrikaans. | "The app speaks both. Afrikaans learning content is on the way." |
| "245+ road signs" | `landing.cred2Title` | Stale understatement — 361 signs now pass both gates. | "360+ road signs" |

Applied in `messages/en.json` and `messages/af.json`. A third instance of the offline claim
was in `landing.faqA4` and is also corrected — the first sweep missed it because the FAQ sits
below the fold of the copy dump. Grep for the claim, do not eyeball the copy.

## Verified true — no change

| Claim | Evidence |
|---|---|
| "installable as an app" | `src/app/manifest.ts` exists; PWA manifest makes it installable |
| "Share your learner's progress over WhatsApp" | implemented in `readiness/result/page.tsx` |
| "Every sign checked against the official DoT chart" | 361 of 362 rows pass both gates; pipeline in `docs/sign-accuracy-pipeline.md` |
| "No biometrics, ever" | architectural constraint, never implemented — nothing collects biometrics |
| "Once-off pricing / no subscription trap" | matches the PRD pricing model |
| "Free readiness test, no sign-up" | anonymous, device-local via `localStorage` |
| "Unlimited practice + mock exams" | practice mode and the Code B mock both ship |

## ✅ Resolved 2026-07-24 — the "AI explains every mistake" family

**The "AI explains every mistake" family** — `landing.subtitle`, `feat1Title`/`feat1Body`,
`planF2`, `step3Body`, `demoSub`, `badge`.

There is **no runtime AI in the learner flow**, deliberately (`CLAUDE.md`). Per-question
explanations are stored, human-verified content shown directly — AI drafted them offline, a human
approved them. Live AI does exist, but only in the **post-exam assessment**.

So "your AI coach explains every mistake" implies something the product doesn't do per question. It
is not a lie — every mistake genuinely does come with a plain-language explanation of why, and AI
wrote the first draft — but a reasonable reader would expect live generation.

**Decision: reworded** (John delegated the call, 2026-07-24). For a product whose moat is verified
accuracy, sold into a market where roughly 8 in 10 candidates fail, *"checked against the official
rules"* is both defensible and a stronger claim than *"AI wrote it"*. It also turns the
no-runtime-AI architecture from something to hedge about into the selling point, and it sidesteps
"the AI made something up" entirely.

| Where | Was | Now |
|---|---|---|
| `subtitle` | "let your AI coach explain every mistake" | "get a clear explanation of every mistake" |
| `feat1Title` | "AI explains every mistake" | "Every mistake explained" |
| `feat1Body` | "Clear, plain-language reasons" | "Plain-language reasons, **checked against the official rules**" |
| `planF2` | "AI explanations on every question" | "An explanation on every question" |
| `step3Body` | "AI explanations that target your weak areas" | "your coach pointing you at the exact lessons you're weakest in" |

**Deliberately kept**, because each is true:

- `badge` "AI-coached, not just quizzes" — the AI Coach is real: post-exam assessment and
  weak-area lesson targeting (shipped 2026-07-24).
- `demoSub` "Tap any option to see the AI Coach explanation appear, exactly as a learner would" —
  the landing demo shows precisely what a learner sees, so the claim is accurate.
- `step3Body`'s weak-area half — that feature now exists rather than being aspirational.

The rule this leaves behind: **claim the verification, not the authorship.** AI drafting is an
implementation detail; a human approving it against the regulations is the product.

---

## Decision: the app is online-only (John, 2026-07-30)

The "works offline" claim is not merely unbuilt — **offline support is not wanted**. K53 Coach always
needs a connection; questions, progress and the Coach all live server-side.

That makes the corrected copy permanent rather than provisional, and it settles the claim in the
strongest way: not "we removed it until we build it", but "it will never be true, by design".

**K53-14 (PWA service worker) is cancelled**, not deferred. The reason is worth keeping: a service
worker caching learner content actively undermines the accuracy gate. The markings review of the same
day is the case in point — content shipped as verified turned out to need correction, and a cached
copy on a learner's phone would keep serving the superseded text after the fix landed. One source of
truth for content is worth more here than offline convenience.

**"Installable" stays and remains true** — `src/app/manifest.ts` exists and the PWA manifest makes the
app installable without an app store. Only the offline half was false.
