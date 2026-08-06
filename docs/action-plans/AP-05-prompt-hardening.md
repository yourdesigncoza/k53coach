# AP-05 — Prompt hardening + validator enforcement

**Priority P2. ✅ Done 2026-08-06.** Six output-quality defects observed across four
real generations; all six now absent, and the rules are enforced rather than merely
asked for.

**Result, measured on 8 real generations** (4 readiness profiles + 4 exam papers,
both locales): **0 rejections** — the fallback rate did not move, which was the
stated risk. On the 94% paper the three near-identical strengths became two that say
different things; on the 36% paper the filler strength became an empty list, and
there is no "best section" flattery or meta-reference anywhere.

`PROMPT_VERSION` is 3, so anything cached against the older prompt regenerates.

## Problem

The four real generations were sound on grounding and section logic, but the prose
has repeatable defects. Each is quoted from a live run.

| # | Defect | Evidence |
|---|---|---|
| 1 | **Leaks its own machinery** — references the input the learner never saw | Run 2: *"Review the rules module for freeway vehicle restrictions and **the exceptions mentioned in the explanation**"* (twice). Breaks constraint 10 in `CLAUDE.md`: prose teaches, it does not reference our sources. Run 4 repeated it: *"**The explanations show that** the sign shape and colour matter a lot"* |
| 2 | **Plan steps target sections that passed** | Run 3: step 3 sends the learner to the rules module for "mirror checks and blind spots" — rules **passed** at 83% |
| 3 | **Duplicate plan steps** | Run 2: steps 3 and 4 are both "rules module, following distance + freeway" |
| 4 | **Flatters a failing section** | Run 1: *"Rules of the road is your **best section** — You got 12 out of 30"*. 40% is not a section to feel settled about |
| 5 | **Filler occupies a strength slot** | Run 1: *"**You are not starting from zero** — Even with a low overall score, you have some correct answers"* — says nothing actionable |
| 6 | **Templated strengths at high scores** | Run 2: three near-identical lines — "solid / mostly secure / strong" + the raw score |

## The half that matters: nothing is enforced

`parseAssessment` in `src/lib/exam-assessment.ts` validates **shape and the href
allow-list only**:

- `verdict` / `oneThing` are non-empty strings
- `strengths` / `focus` are arrays of `{title, note, topic}` with a valid topic
- every `plan[].href` is in `allowedHrefs()`
- `ctaTopic` is a valid topic

It does **not** check step count, duplicate steps, string lengths, whether a plan
step targets a failed section, or output language. So every rule below, if written
only into the prompt, is a request the model may quietly ignore — and the result is
cached and shown to a paying learner. Prompt wording alone is not a guarantee.

## Approach

### 1. Prompt rules (add to `ASSESSMENT_SYSTEM`)

- **No meta-references.** Never mention "the explanation", "the explanations", "the
  source", "the module text", "the supplied text", or the payload. Teach the point
  directly. *(defect 1)*
- **Plan steps must address sections below their pass mark**, weakest first. A
  passed section may appear only in the final maintenance step, if at all.
  *(defect 2)*
- **No two steps may repeat the same action on the same topic.** *(defect 3)*
- **2-4 steps, and fewer is better.** Currently reads as though 4 are expected; a
  94% paper does not need four study steps. *(defect 3, 6)*
- **Never call a section below its pass mark "your best"** or otherwise
  superlative — "least weak" or a plain statement of the score. *(defect 4)*
- **Every strength must name a topic and a score.** No mood or effort praise —
  "You showed up" is appropriate in the deterministic fallback, not from the model.
  *(defect 5)*
- **When all sections pass, merge or vary the strengths** rather than emitting one
  line per section in the same shape. *(defect 6)*
- Keep the existing house-length discipline in view: the sign explanations run a
  median 187 characters, max 397 (`CLAUDE.md` constraint 10).

### 2. Validator rules (extend `parseAssessment`)

Reject → the caller falls through to `buildFallbackAssessment`, which is the correct
degradation. Checks:

- `plan.length` between 2 and 4
- no duplicate `href` **and** no near-duplicate `step` text within a plan
- `strengths` / `focus` each 1-4 items
- max lengths on `verdict`, `oneThing`, `title`, `note`, `step` (pick from the
  observed house sizes, generously — the aim is catching runaway output, not
  policing style)
- **no meta-reference substrings** in any rendered field (`the explanation`,
  `the source`, `supplied`, `payload`) — cheap, and directly enforces defect 1
- `focus[].topic` must be a section that actually failed, when any section failed

Language enforcement is deliberately **not** attempted here — detecting Afrikaans
reliably is out of scope; AP-03's re-test covers it by inspection.

### 3. Bump `PROMPT_VERSION`

Otherwise nothing already cached benefits. This is why AP-03 lands first.

## Files

- `src/lib/exam-assessment.ts` — `ASSESSMENT_SYSTEM`, `parseAssessment`,
  `PROMPT_VERSION`
- `src/lib/exam-assessment.test.ts` — validator unit tests (reject cases are the
  point: duplicate steps, 5 steps, meta-reference, over-length)
- `docs/ai-assessment.md` — record the tone rules so they are not re-litigated

## Risks

- **Over-tight validation silently downgrades everyone to the fallback.** The
  fallback is a worse product; a validator that rejects 30% of generations is a
  regression, not a fix. Measure: run all five profiles and count rejections before
  merging.
- **Rules fighting each other** — "strengths must name a score" plus "merge
  strengths when all pass" needs one worked example in the prompt, not just prose.
- Substring bans can false-positive on legitimate learner-facing wording; keep the
  list short and specific.

## Verification

Re-run every profile and **diff against the captures already taken** (the pre-change
text of runs 1-5 is saved in the scratchpad `assessment/*.txt`):

```bash
for p in weak strong mixed; do node scripts/e2e/assessment.mjs --profile $p --locale en; done
node scripts/e2e/assessment.mjs --profile mixed --locale af
```

Check each defect is gone: no "the explanation" anywhere; no plan step aimed at a
passed section; no duplicated step; no "best section" under a pass mark; no filler
strength; strengths varied at 94%. And confirm the fallback rate did not rise.

## Done when

- [x] All six defects absent across the profiles
- [x] Validator rejects/repairs each defect in unit tests (22 in `exam-assessment.test.ts`)
- [x] Fallback rate unchanged — 0 rejections in 8 real generations
- [x] `PROMPT_VERSION` bumped to 3 so existing cached assessments regenerate
- [x] Tone rules recorded in `docs/ai-assessment.md` §6a

## What changed from the plan

**Repair beat reject.** The plan said every check should reject to the fallback.
Building it that way would have downgraded a learner to a template over a duplicate
plan step — trading real grounded coaching for a formatting preference. So the
validator repairs what is safely repairable (truncate lists, drop duplicate steps,
drop focus aimed at a passed section) and rejects only what cannot be salvaged
(meta-references, runaway lengths, a plan too short after repair, bad hrefs).

**"strengths/focus each 1-4 items" was dropped.** A minimum of one contradicts the
later, better rule that an empty strengths list is more honest than filler — which
is exactly what the 36% paper now produces. Maximum only.
