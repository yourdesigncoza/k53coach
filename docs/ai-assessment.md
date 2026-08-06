# AI Assessment — post-test coaching (design + scenario mock)

**Status:** design mock / not built. No content, question bank, or copy is finalised — this document *represents* what the feature produces so we can react to it before writing code or content.

**What it is.** After a learner finishes the free readiness test and sees their score, they can tap **"View AI Assessment"** to get a short, personalised coaching read: *where you stand, what you've already got, exactly where you're losing marks, and a concrete plan to close the gap.* This is the "future post-test coaching" feature the architecture already reserves AI for (see `CLAUDE.md` — no runtime AI per question; AI is for score-improvement/recommended-learning). It must stay **grounded in verified content** and **never invent a legal or safety rule**.

Think of it as the difference between a scale and a coach. The result page (`/readiness/result`) is the scale — a number and a band. The AI Assessment is the coach standing next to it saying *"here's what that number means for you, and here's your next hour of study."*

---

## 1. Where it lives

- **Trigger:** a gold primary button **"View AI Assessment ✨"** on `/readiness/result`, directly under the readiness ring / band.
- **Result:** opens the assessment inline (same white app surface, same card system as the quiz). No new full-page redirect — it expands below the score, matching the "no wasted clicks" principle we just applied to the readiness flow.
- **Re-runnable:** the same result always produces the same structure; prose may vary slightly if regenerated. For the anonymous free test the input is the in-session `ReadinessResult` + the answered questions (device-local, POPIA-safe — nothing about a minor is sent to a server or stored server-side).

---

## 2. What the AI is given (inputs — all grounded, no invention)

The model only ever sees data we can stand behind:

| Input | Source | Why it's safe |
|---|---|---|
| `overall`, `band`, `byTopic[]`, `weakest` | `ReadinessResult` (DB9, `src/lib/readiness.ts`) | Computed, deterministic |
| Per-question detail: topic, chosen vs. correct, **the verified explanation** | the test's questions + answers | The AI *quotes/paraphrases the verified explanation* — it does not author K53 rules |
| Topic labels | `TOPIC_LABEL` (Road Signs / Rules of the Road / Vehicle Controls) | Fixed taxonomy |
| Sign code + name for missed sign questions | `road_signs` (approved set) | Verified artwork/meaning |

It is **not** given: the learner's name, age, or any PII (the free test is anonymous); anything not already verified in the app.

**Grounding rule (hard):** every claim in the "why you missed this" and "how to fix it" text must trace back to a verified explanation or module in the app. If we don't have verified content for a gap, the AI says *"review the {Topic} module"* rather than inventing the rule. No new legal/safety claims, ever.

---

## 3. Anatomy of an assessment (the structure the AI fills)

The scaffold is deterministic (reliable layout, band-aware); the AI writes the prose inside each slot. Rendered as a stack of white cards on the app surface.

1. **Verdict headline** — one warm, plain sentence, band-aware. Never shaming (minor-safe tone).
2. **Where you stand** — the number in human terms + what it would mean on the real test.
3. **What you've already got** ✅ — name the strong topic(s) specifically, so it feels earned, not generic praise.
4. **Where you're losing marks** ⚠ — the weak topics, ranked, each with 1–3 *specific* misses drawn from the questions they actually got wrong (grounded in the verified explanation of each).
5. **Your plan** 🎯 — an ordered, concrete study path mapped to real app destinations: `Learn → {Topic}` then `Practice → {Topic}`, weakest first. Time-boxed ("~20 min").
6. **The one thing** — a single highest-leverage focus if they only do one thing.
7. **Next step (CTA)** — button to the weakest topic's practice, and (post-MVP) the paywall / R20 AI Coach tie-in.

Tone: warm, specific, second person, short sentences, South African learner context, encouraging even when the score is low. Reading age ~Grade 8.

---

## 4. How it would look (layout sketch)

```
┌───────────────────────────────────────── white app surface ──┐
│  ⟨ readiness ring 40% ⟩   Not ready yet                        │
│  [ ✨ View AI Assessment ]        ← gold primary button       │
│  ───────────────────────────────────────────────────────────  │
│  ▸ expands below into cards:                                   │
│                                                                │
│  ┌── Verdict ─────────────────────────────────────────────┐   │
│  │ ✨ Coach Says                                            │   │
│  │ You're not there yet — but you're 3 good study          │   │
│  │ sessions away, and now you know exactly which ones.     │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌── What you've got ✅ ──┐  ┌── Where marks go ⚠ ────────┐   │
│  │ Rules of the Road 60%  │  │ Road Signs 17% ▓░░░░░       │   │
│  │ You read right-of-way   │  │ • Yield vs. Stop           │   │
│  │ well.                   │  │ • No-overtaking sign        │   │
│  └────────────────────────┘  └────────────────────────────┘   │
│  ┌── Your plan 🎯 ────────────────────────────────────────┐   │
│  │ 1. Learn → Road Signs (~15 min)                         │   │
│  │ 2. Practice → Road Signs until 8/10                     │   │
│  │ 3. Re-take the readiness test                           │   │
│  └────────────────────────────────────────────────────────┘   │
│  [ Practice Road Signs → ]                                     │
└───────────────────────────────────────────────────────────────┘
```

Uses the existing tokens: white `--surface` cards, gold primary, soft `--success`/`--danger` tints for strong/weak, the topic-coloured bars, the "Coach Says" spark label from the quiz. It should feel like the same coach that spoke during practice.

---

## 5. Demonstration scenarios

Three learners across the three bands. Each shows the **exact data in** and a **sample generated assessment out**. Content is illustrative — real copy comes from verified explanations when built.

### Scenario A — "Not ready yet" (overall **40%**)

**Data in:** `band: not-ready`, `weakest: signs`
| Topic | Score |
|---|---|
| Road Signs | 1 / 6 (17%) |
| Rules of the Road | 3 / 5 (60%) |
| Vehicle Controls | 2 / 4 (50%) |

Missed (grounded in their wrong answers): mistook a **Yield** triangle for a **Stop**; picked "no entry" for a **no-overtaking** sign; didn't know a blue disc = **mandatory** (must-do), not a warning.

**Generated assessment:**

> **✨ You're not there yet — but you're closer than the number feels.**
> 40% means you'd not pass today, and that's okay: this test's whole job is to show you *where*, before it costs you a booking fee. You've already found it.
>
> **What you've got ✅** — Your **Rules of the Road** are solid (60%). You handled right-of-way well; keep that.
>
> **Where the marks are going ⚠** — **Road Signs (17%)** is the gap, and it's the biggest single chunk of the test. Three specific things tripped you:
> - You read a **Yield** sign (downward red triangle) as a full **Stop**. They're different: yield = slow down and give way; stop = come to a complete stop every time.
> - You chose "no entry" for the **no-overtaking** sign.
> - A **blue round** sign tells you what you *must* do — it's not a warning.
>
> **Your plan 🎯**
> 1. **Learn → Road Signs** (~15 min) — start with the shapes-and-colours section.
> 2. **Practice → Road Signs** until you hit 8/10 two rounds running.
> 3. Re-take this readiness test — you should jump a full band.
>
> **The one thing:** learn what each *shape and colour* means before the specific signs. It unlocks half the questions.
>
> [ Practice Road Signs → ]

---

### Scenario B — "Almost ready" (overall **60%**)

**Data in:** `band: almost-ready`, `weakest: rules`
| Topic | Score |
|---|---|
| Road Signs | 4 / 6 (67%) |
| Rules of the Road | 2 / 5 (40%) |
| Vehicle Controls | 3 / 4 (75%) |

Missed: got the **following distance** (2-second rule) wrong; unsure who goes first at a **4-way stop**; missed when to yield to a **pedestrian at a crossing**.

**Generated assessment:**

> **✨ So close — one topic is standing between you and test-ready.**
> 60% puts you in striking distance. Fix one area and you're over the line.
>
> **What you've got ✅** — **Vehicle Controls (75%)** and **Road Signs (67%)** are in good shape. You clearly know your way around the car.
>
> **Where the marks are going ⚠** — **Rules of the Road (40%)** is pulling you down. Three to nail:
> - **Following distance** — remember the two-second rule (pick a fixed point; you should pass it no sooner than two seconds after the car ahead).
> - **Four-way stop** — first to stop is first to go; if you stop together, the vehicle on the right goes.
> - **Pedestrian crossings** — pedestrians already on the crossing have right of way.
>
> **Your plan 🎯**
> 1. **Learn → Rules of the Road** (~20 min), focus on right-of-way and following distance.
> 2. **Practice → Rules of the Road** to 8/10.
> 3. A quick **Road Signs** top-up to convert your 67% to full marks.
>
> **The one thing:** right-of-way rules. They repeat across the test in different wording.
>
> [ Practice Rules of the Road → ]

---

### Scenario C — "Test ready" (overall **87%**)

**Data in:** `band: test-ready`, `weakest: controls`
| Topic | Score |
|---|---|
| Road Signs | 6 / 6 (100%) |
| Rules of the Road | 4 / 5 (80%) |
| Vehicle Controls | 3 / 4 (75%) |

Missed: **handbrake use on a hill start**.

**Generated assessment:**

> **✨ You're test-ready — go book it.**
> 87% is a comfortable pass. This is the "tidy up the last corner" assessment, not a warning.
>
> **What you've got ✅** — **Road Signs 100%**, **Rules 80%**. That's the hard part of the learner's test, done.
>
> **Where to sharpen ⚠** — one small **Vehicle Controls** slip: the **hill start**. Handbrake on until the clutch bites and the car wants to pull, then release — that's what stops the roll-back that fails people on the day.
>
> **Your plan 🎯**
> 1. One **Practice → Vehicle Controls** round to lock the hill start.
> 2. A full 15-question dry run the night before.
>
> **The one thing:** don't over-study. You know this — a light review beats cramming.
>
> [ Book-readiness checklist → ]

---

## 6. Generation approach (when we build it)

- Single entry point `src/lib/llm.ts` (`llmChat`, `gpt-5.4-mini`) — never a direct provider call. Graceful when the key is absent.
- **Structured output:** the model returns JSON matching the §3 scaffold (verdict, strengths[], focus[], plan[], oneThing, ctaTopic). The UI renders the cards — the model never controls layout.
- **Grounded prompt:** system prompt pins the tone + the hard grounding rule; user payload is the §2 data (result + per-question verified explanations). Explicit instruction: *use only the supplied explanations; do not state any rule not present in them; if a gap has no verified content, direct to the module.*
- **Deterministic fallback:** with no API key (demo mode) or on failure, render a template built purely from `ReadinessResult` (band verdict + weakest-topic plan). The feature degrades to useful, never broken.
- **Where it runs:** for the anonymous free test, generate on demand from the in-memory result — no server-side storage of the minor's answers. A signed-in learner's assessment could be persisted with their attempts (after consent), feeding the full DB9 blend over time.

---

## 6a. Tone rules — asked for AND enforced (AP-05, 2026-08-06)

Recorded here so they are not re-litigated. Each came from a defect in a real
generation, and each is now **both** a prompt rule and a validator check —
because a rule that lives only in the prompt is a request the model may quietly
ignore, and the result is cached and shown to someone who paid.

| Rule | Enforcement |
|---|---|
| Never name our own machinery — "the explanation", "the supplied text", the question bank. The learner saw questions (constraint 10) | **Reject.** Substring check over every rendered field |
| Plan steps address sections below the pass mark, weakest first | **Repair.** Focus items on a passed section are dropped when some other section failed |
| No two plan steps that are the same action | **Repair.** Same href or same normalised sentence is dropped |
| 2–4 steps, and fewer is better | **Reject** below the format's minimum after repair; truncate above the maximum |
| Never call a section below its pass mark "your best" | Prompt only — a substring ban would false-positive on legitimate praise |
| Every strength names a topic and a score; no mood filler | Prompt, plus an empty list is explicitly allowed and preferred over filler |
| When all sections pass, vary the strengths rather than one identical line each | Prompt only |
| Runaway field lengths | **Reject** past generous ceilings (verdict 400, note 400, step 300, title 80) |

**Repair before reject, always.** The fallback is a worse product than a slightly
untidy real assessment, so the validator only rejects what cannot be salvaged.
Measured on 8 real generations across both formats and both locales when this
landed: **0 rejections** — the enforcement cost nothing in fallback rate.

Deliberately not enforced: output language. Detecting Afrikaans reliably is out
of scope; the e2e drivers check it by inspection instead, including an
English-leak check that already caught one.

## 7. Guardrails

- **No invented law/safety claims** — grounded to verified explanations only. This is the moat and the liability line.
- **POPIA** — anonymous free test stays device-local; no PII to the model; minor-safe.
- **Tone** — encouraging, never shaming; a low score is framed as "you found the gap early." Grade-8 reading age, SA context.
- **Honesty** — the assessment reflects the real diagnostic (straight topic accuracy today); it doesn't imply the full DB9 blend until we actually have history to blend.

---

## 8. Open questions (for John)

1. **Free or gated?** Is the AI Assessment part of the free test (conversion hook), or the first thing behind the R149–R199 unlock / R20 AI Coach?
2. **Depth** — the short coaching read above, or a longer "full report" (per-question walkthrough) for paid users?
3. **Persistence** — keep past assessments for signed-in learners to show improvement over time (feeds DB9 weak-area-improvement)?
4. **Voice** — keep the "Coach Says" persona consistent with practice mode? (Recommended: yes.)
5. **Content trigger** — do we need a first pass of verified explanations across all readiness questions before this can ship, or ship the deterministic-fallback version first?
