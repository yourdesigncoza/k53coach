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

## ⚠️ Open — needs a decision, not a copy edit

**The "AI explains every mistake" family** — `landing.subtitle`, `feat1Title`/`feat1Body`,
`planF2`, `step3Body`, `demoSub`, `badge`.

There is **no runtime AI in the learner flow**, deliberately (`CLAUDE.md`). Per-question
explanations are stored, human-verified content shown directly — AI drafted them offline, a human
approved them. Live AI does exist, but only in the **post-exam assessment**.

So "your AI coach explains every mistake" implies something the product doesn't do per question. It
is not a lie — every mistake genuinely does come with a plain-language explanation of why, and AI
wrote the first draft — but a reasonable reader would expect live generation.

This is the central positioning claim, so it is a business decision rather than a copy fix. **Not
changed.** Two options:

1. **Reword to what is true and arguably stronger** — e.g. *"Every mistake explained — in plain
   language, checked by a human."* Verified content is a better story than generated content for a
   product selling accuracy, and it sidesteps "the AI made something up" entirely.
2. **Keep the wording** on the basis that the AI Coach is a real feature (post-exam assessment,
   weak-area recommendations) and the explanations are AI-authored.

Recommendation: option 1. It is defensible under scrutiny, and it turns the no-runtime-AI
architecture from something to hedge about into the selling point.
