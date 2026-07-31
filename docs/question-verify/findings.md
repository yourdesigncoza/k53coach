# The 79 draft rules questions — adversarial verification (2026-07-30)

Ten independent reviewers, one per batch, each given the questions and the extracted text of the
**National Road Traffic Act 93 of 1996** and the **National Road Traffic Regulations 2000**, and told
to refute rather than confirm. Every verdict had to carry a verbatim quote from the law or be
discarded.

| Verdict | n | Meaning |
|---|---|---|
| **SOUND** | **54** | Marked answer correct, distractors all wrong, explanation accurate |
| EXPLANATION_DEFECT | 15 | Answer right, explanation misstates the law |
| AMBIGUOUS | 5 | More than one option defensible, or the stem is unscoped |
| UNSUPPORTED | 5 | No provision governs it, or ours contradicts it |
| **WRONG_ANSWER** | **0** | — |

**Not one marked answer is wrong in law.** That is a materially better result than the road-markings
review, and the difference is instructive: these were drafted against the legislation, and the
legislation is now on disk to check them against.

Per-question verdicts with citations: `verdicts.json`.

---

## 1. Fabricated citation — sweep required

**Five items cite `NRTA s 4(3)`. There is no s 4(3)** — section 4 ends at subsection (2). Two
reviewers found it independently.

`RR-073` `RR-074` `RR-075` `RR-076` `RR-077`

The same block also cites **s 42(1)** (roadworthiness) and **regs 35/36** (number-plate and licence-disc
*display*) on items about roadworthiness and plates, where those provisions do not support the claim.
The block is identical across all five, so it was templated per topic rather than derived per item.

This is the most serious finding, and not because the answers are wrong — they are right. **A citation
that does not exist is worse than no citation: it looks like evidence and defeats the audit trail.**
The 125 already-approved questions carry **no citations at all**, so this pattern cannot be assumed
confined to the drafts. Grep the whole bank for `s 4(3)` and `42(1)` before anything ships.

## 2. Two items contradict each other

> ### ⚠️ CORRECTED 2026-07-31 — this section was written against superseded text
>
> The reasoning below quotes **reg 297(2) as enacted in 2000**. That subregulation was
> **substituted by GNR.2116 r. 52 w.e.f. 5 October 2001**, and the substituted text allows
> **one** route, not three:
>
> > "No person shall drive a vehicle on, over, across or within any dividing space, barrier or
> > section referred to in subregulation (1), **except through a constructed intersection**:
> > Provided that no person shall so drive through such constructed intersection where such
> > driving is prohibited by an appropriate road traffic sign or by a traffic officer…"
>
> Consequences, all applied 2026-07-31 (`scripts/data-repairs/question-fixes-drafts-2026-07-31.json`):
>
> - **`RR-097` is SOUND, not AMBIGUOUS.** Its stem ("the only lawful way") and its key
>   ("through a properly built intersection — and not even there if a sign or a traffic officer
>   forbids it") match the text in force exactly. Only its citation changed, and it now carries an
>   explicit warning so the next reviewer with a 2000 copy does not "refute" it again.
> - **`RR-096` was still defective**, but for a smaller reason: its key stated the prohibition as
>   absolute, dropping the constructed-intersection exception, and its explanation added a
>   stopping/parking rule that reg 297(2) does not contain.
> - **`src/content/road-rules.ts` RR21 must NOT be "fixed" as recommended below.** It was widened
>   to three routes on the strength of this section; that was a regression and has been reverted.
>
> Caveat recorded honestly: **GG 22736 itself is not on disk.** The substitution is taken from the
> consolidated text in `init/nrtr-2000-consolidated-part1-kzntransport.pdf` (consolidated to
> GNR.209 of 9 March 2012), which attributes it specifically and prints a text differing from the
> original. Obtaining GG 22736 would close it. This is the **reg 101(1) trap in a second place** —
> see §3 — and the general exposure it describes now has a worked second example.

*Original text of this section, retained for the record:*

`RR-096` teaches that the dividing section of a divided road is absolutely off limits.
`RR-097` teaches that you may cross it at an intersection.

Both are under objective RR21, and a learner can draw both in one sitting. **Reg 297(2)** settles it —
the prohibition carries an express proviso: *"except through an opening in such space, barrier or
section or at a cross-over or intersection"*. Three lawful routes, not zero and not one.

**The root cause is in the lesson, not the questions:** `src/content/road-rules.ts:381` says *"the only
legal way across is a properly built intersection"*. Fix the learning object or every RR21 question
regenerated from it inherits the defect.

## 3. An amendment gap that would embarrass us

`RR-063` says a learner's licence is valid **24 months**. That is correct in current law — but
**reg 101(1) as we hold it says 18 months**, and the item cited the 2000 regulations. Follow the
citation and it refuted the answer.

> **Resolved 2026-07-30.** The instrument is now in `init/`, and the explanation is more interesting
> than expected: **reg 101(1) was never textually amended.** It still reads 18 months in every
> consolidated copy. The change was made by ministerial notice *under* the regulation —
> **GN 134, GG 32959 (17 Feb 2010)**: *"hereby extend the period of validity of a learner's licence
> from 18 months to 24 months"*. So the citation must name the notice; reg 101(1) alone is wrong.
> A reviewer following the reg text would have "refuted" a correct answer forever.

**Every duration, fee and age in the bank carries the same exposure** — our NRTR copy is the 2000
original. `RR-029` (child restraints) was the same story: reg **213(6A)**, inserted by GN R.846 of
2014, with no equivalent in the 2000 text at all.

## 4. Three items rest on a number that is not in the law

`RR-054` `RR-038` `RR-057` — the **two-second following rule**.

There is no prescribed following distance in South African law. The governing provision is
**reg 308(1)(b)**: *"follow another vehicle more closely than is reasonable and prudent having regard
to the speed of such other vehicle and the traffic on and the condition of the roadway"* — a standard,
no number. Two seconds is K53 teaching convention.

The items are answerable and pedagogically sound. They must not be presented as legal requirements.
This exposes a schema gap: there is no way to mark an item *"sound practice, no statutory basis"*, so
the pipeline currently forces either a false citation or a blank one.

## 5. Items that are legally unanswerable as written

- **`RR-040`** (order of observation before a lane change) — distractor (0) "signal, then check mirrors,
  then move" **breaks no law**. Two of three options are lawful. K53 technique, not a rules item.
- **`RR-102`** (hand signal on a freeway) — the stem describes a broken indicator, which engages
  reg 323(2)(d)'s exception *"except for a cause beyond his or her control"*. The stem hands the
  learner the exception and then marks it wrong.
- **`RR-046`** (empty mini-circle) — distractor (2)'s premise, *"a circle has no stop line"*, is **true**:
  mini-circles carry yield line RTM2, not stop line RTM1.
- **`RR-097`**, **`RR-080`**, **`RR-045`** — unscoped stems (see verdicts.json).

## 6. Mini-circle and roundabout are different rules

The bank treats them as one topic. They are not:

| | Priority rule |
|---|---|
| Mini-circle (sign **R2.2**) | Yield to whoever crosses the **yield line** first |
| Roundabout (sign **R137**) | Yield to traffic from the right **already within** the roundabout |
| **reg 301** | Residual junction rule — expressly subordinate to a contrary sign |

Any RR6 item that says "yield to the right" at a *mini-circle* is at risk. `RR-044` states the
roundabout rule on a mini-circle question.

## 7. Two disputes settled, both against our earlier position

**Learners on freeways — the client was right.** There is **no provision anywhere** in the Act or the
Regulations barring a learner from a freeway. Reg 323(1) is an exhaustive list of *vehicle classes*
(animal-drawn, pedal cycles, ≤50 cc motorcycles, tricycles/quadricycles, invalid carriages, tractors) —
no licence condition. The only conditions on a learner's licence are the three in **reg 99(2)**:
supervision, no motorcycle passenger, no carrying persons for reward. Roads are not restricted.

**The trailer reflective-material dispute (K53-36) is settled** — see that issue. Short version:
**reg 192A(1)** makes yellow retro-reflective material compulsory only on a goods vehicle whose GVM
**exceeds 10 000 kg**; below that it is optional but must be yellow if fitted. The memo saying
"not required" is right.

## 8. What happens next

`review_status` stays `draft` on all 79. **Nothing here is approved, and nothing can be approved by an
AI pass** — constraint 9. The 54 SOUND verdicts are a triage result, not a sign-off: they tell a human
where to spend attention, and every one carries a quote that can be checked in seconds.

Recommended order:
1. ~~Sweep and fix the `s 4(3)` citation block (5 items, plus check the approved 125).~~ **Done** —
   swept bank-wide 2026-07-31, **0 hits**. The three remaining reg 35/36 citations (`RR-073`,
   `RR-074`, `RR-075`) are on plate- and disc-display items, where those provisions are apposite.
2. ~~Fix `src/content/road-rules.ts:381`, then `RR-096`/`RR-097`.~~ **Superseded — do not do this.**
   See the correction box at §2: the lesson's original wording was right, and widening it was a
   regression. Reverted 2026-07-31.
3. ~~Rewrite the 5 AMBIGUOUS stems and the 15 explanation defects.~~ **Done 2026-07-31** —
   `scripts/data-repairs/question-fixes-drafts-2026-07-31.json`, 20 ops over 18 items. Two of the 15
   (`RR-076`, `RR-077`) needed no write: their only defect was the `s 4(3)` citation, already gone.
   `RR-097` was re-verified SOUND (§2) and took a citation warning instead of a rewrite.
4. ~~Park `RR-063` until the amending notice is obtained.~~ **Done** — GN 134 of 2010 obtained and cited.
5. Human pass over the 54, then apply with `apply-question-verification.mjs --by "<name>"`.

### Still open from this review (2026-07-31)

- **The 5 UNSUPPORTED verdicts are untouched** — `RR-054`, `RR-038`, `RR-057` (the two-second rule),
  `RR-040` (legally unanswerable), `RR-063` (cited, but see §3). §4's schema gap is the real blocker:
  there is still no way to mark an item *"sound practice, no statutory basis"*, so the pipeline
  forces either a false citation or a blank one.
- **`RR-022` is approved and live, and carries the §6 defect.** It asks "You are approaching a traffic
  circle. Who has right of way?" and keys *"Traffic already in the circle / approaching from your
  right"* on a citation to `reg 301` — fusing the roundabout rule, the mini-circle rule and reg 301
  into one option. Found while fixing `RR-044`; **not changed**, because it is in the approved bank
  and that is a separate decision. Three more approved items sit in the same family: `RR-004`,
  `RR-021` and `q-rules-2` all teach the two-second rule that §4 shows has no statutory basis.
- **`RR-037` is `approved`, not draft** — it was carried in this draft-review's verdict set anyway.
  Its fix therefore changed a question that is live to learners now.
