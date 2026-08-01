# Road markings — adversarial review findings (2026-07-30)

Sixteen independent reviewers, one per marking, each given the drafted content and the printed
manual page and told to **refute**, not confirm. Each verdict had to carry a verbatim quote or be
discarded. Reviewers were not shown the reasoning behind the drafts, only the drafts themselves —
and the drafting `confidence` notes were handed over as *claims to check*, not as context.

**Result: all 16 markings have defects. None is clean.** This document is the triage. It does not
replace the human pass — it tells that pass where to look.

Source of truth throughout: `resources/sartsm/V1C7.pdf` — **SADC** RTSM Vol 1 Ch 7, Road Markings (May 2012).

---

## 1. The systemic finding: the drafting notes are the least reliable part

The `confidence` field on each marking — the thing that looks like evidence, and the thing the
accuracy gate leans on — was wrong or overstated more often than the prose it certifies.

| Marking | What the note claimed | What the reviewer found |
|---|---|---|
| `RTM1` | "CLIENT COPY NARROWED: 'no stop sign ⇒ same meaning as one' is too broad" | **The client was right.** §7.2.1.1: *"In any other circumstance STOP LINE markings shall have the significance assigned there to by STOP sign R1."* The note deleted a true statement and recorded the deletion as a correction. |
| `RTM1` | "width NRTR reg 286(2)(c)(i)" | Certifies a width **the content never states**; the manual gives it itself at §7.2.1.4 (300 mm urban / 500 mm rural). |
| `RTM4` | "duties identical to RTM3 §7.2.4.1" | §7.2.4.1 is RTM4's own paragraph, not an RTM3 provision. Asserts a cross-marking equivalence it could not have checked. |
| `RM9` | "§7.2.21 (RM17.1-RM17.4)" | **7.2.21 is a page number, not a section number** — the running head of the page being read. |
| `RM9` | "RM17.3 = disabled" | RM17.3 appears nowhere in the cited section. |
| `RM13` | "RM13↔R216 pairing stated at §2.4.13.4" | The pairing is printed at **§7.2.17.5, on the page the drafter was reading**. Cited an unsupplied section for a fact in the supplied one. |
| `RM12` | "RM12↔R217 pairing stated explicitly at §2.4.14.4" | R217 appears nowhere. The neighbouring section names **R216** for the *yellow* line — an easy confusion. |
| `RM12` | "VERIFIED: solid-150 / broken-100 distinction" | The 100 mm broken width **never reached the prose**. |

**Every citation in the library names the wrong document.** Four reviewers independently flagged it:
the manual self-identifies in its footer as **"SADC - RTSM - VOL 1"**. Our citations all say
"SARTSM". These are not the same publication.

**Every `NRTR 2000` citation in the library is unverified.** The regulations were never consulted —
they are not in the repo. A large share of the most examinable content (loading exceptions,
the shoulder proviso, stopping definitions) rests entirely on them.

---

## 2. Must fix before any of this ships

Ranked by what would cost a learner a mark or put them in danger.

### Fabricated permissions — a learner acting on these is unsafe

| Marking | Defect |
|---|---|
| `RM9` | Draft says you may cross into an exclusive-use lane to reach premises *"when it is safe"*. **No such exception exists in §7.2.13.** It is the barrier-line (RM1/RM2) exception transplanted onto a bus lane. |
| `RM10` | Draft says a turning vehicle *"may move into the box and wait for a gap"*. ¶1 grants permission to **enter** only — never to wait. The draft silently converted one into the other, apparently echoing the UK Highway Code. |
| `RM10` | *"the only legitimate reason to be sitting inside the box"* — ¶1 regulates **entry**, not presence. A driver who entered lawfully and was then delayed has breached nothing. |

### Rules stated unconditionally that the manual conditions

| Marking | The missing condition |
|---|---|
| `RM4.1` | The whole shoulder prohibition applies only *"on a roadway with more than one lane in either or both directions of travel"* (¶1(a)). Three of six content blocks drop it. |
| `RTM4` | Pedestrian priority is conditioned by ¶1(b) on the pedestrian **obeying the pedestrian signal** where one exists. Draft teaches unconditional priority. |
| `RTM3` | Same proviso, same omission. |
| `RM12` / `RM13` | Broken forms bind only *"during the time period indicated by an accompanying road sign"*. Draft says *"in either case a driver may not stop"*. |
| `RM8` | *"the only direction you are allowed"* is false for RM8.2, RM8.4 and RM8.6, which each permit **two** directions. The draft's own test hint contradicts its plain-English line. |

### Wrong facts

| Marking | Draft says | Manual says |
|---|---|---|
| `RM7` | In a loading zone **only a goods vehicle** may stop | ¶1(a): a goods vehicle **"or a motorcycle, motor tricycle or motor quadricycle designed or adapted to convey goods"** — four categories |
| `RM15` | The mini circle is **flat paint** | ¶4: *"It is recommended that the road surface be raised but mountable by traffic over the area of the marked circle."* |
| `RM15` | The circle is part of RM15 | ¶3: *"The marked circle is a form of PAINTED ISLAND marking RM5."* RM15 is **the arrows only** |
| `RM5` | Bounded by *"a white boundary line or lines"* | Plate: *"Border: White and/or yellow"*; one boundary may be a **kerb line**, or a yellow RM4.1 |
| `RM1` | Exception for a **parked** obstruction | ¶1(iii): *"a **stationary** obstruction"* — includes debris, a breakdown, roadworks |
| `RM2` | Cross only for an obstruction **blocking the road** | ¶1: *"any stationary obstruction **in the roadway**"* — no blocking requirement |
| `RTM3` | Driver yields to pedestrians **within the lines** | ¶1 places no such limit on the driver's duty |
| `RTM4` | *"the fatter the paint, the more people"* | It is the **length** of the crossing that scales with volume; block width has a fixed 600 mm minimum |
| `RM7` | *"a B or MB bay… a bus or minibus"* | ¶1(b): *"a bus or minibus, **as appropriate**"* — B and MB are not interchangeable |

### Content the drafts invent

`RTM1` alone carries five unsourced driver-conduct claims — front wheels behind the line, creeping
forward to see, the vehicle rocking back, pulling away when clear, and *"if a stop line is worn away,
treat the junction as if there is no line"*. That last one is unsourced legal advice.

---

## 3. Missing content the manual treats as important

The most examinable omissions, not the engineering detail:

- **`RM5`** — an entire third form of painted island (§7.2.9.2(c): two RM1 lines enclosing a solid
  yellow marking) with **no diagonal bars at all**. A learner shown that figure could not identify it.
- **`RM12`** — the broken line's 100 mm width; the one-way right-side exception; that the line may be
  painted **on the kerb face** itself.
- **`RM13`** — §7.2.17.3, a "shall only" limit: urban roadways at the general urban speed limit,
  **not freeways**. Also §7.2.17.5's warning that **parking may be prohibited even with no line**.
- **`RM8`** — §7.2.12.6: a mandatory direction arrow must **not** be used for a lane split; that is
  the GM3 bifurcation arrow. A learner would read GM3 as an instruction.
- **`RM9`** — the enabling **road sign**, not the paint, grants the right (¶1 proviso); 250 m max
  sign spacing; contra-flow lanes running the **opposite** way.
- **`RM1`** — the WM8 "no overtaking line ahead" arrows; and that a solid white line may instead be a
  **channelising line** (¶3: *"These markings can therefore appear identical"*).
- **`RTM3`/`RTM4`** — the crossing must be preceded by a stop or yield line, and which one depends on
  whether control is by signal or sign. That is where the driver actually stops.
- **`RM6`** — bays are commonly marked as **T-marks or corner marks**, not a closed box, which
  undercuts the draft's "white box" model.

---

## 4. What this changes

The **artwork** gate is unaffected — that rests on the DoT chart and is sound.

The **content** gate is the problem. Sixteen for sixteen means this is not a sampling issue to be
spot-checked; the drafting pass was systematically over-confident, and its self-certification notes
were the least trustworthy part of the record. The correct response is a **rewrite against the
manual**, not an edit pass — and the rewrite must:

1. Cite **SADC-RTSM Vol 1**, not "SARTSM".
2. Obtain **NRTR 2000** before asserting anything that rests on it, or drop the claim.
3. Carry the manual's conditions (multi-lane, signed hours, signal provisos) into the
   learner-facing blocks, not only into "formal meaning".
4. Stop inventing driver-conduct detail the manual does not contain.
5. Record what was checked and against which paragraph — not a free-text "VERIFIED".

Two client-facing corrections now stand: **RM12/RM13** (recorded 2026-07-30) and **RTM1** — see below.

---

## 5. Adjudication: the RTM1 narrowing (escalated, and settled)

Because this reverses an earlier decision and has client-facing consequences, it was escalated to a
second reviewer instructed to **defend** the narrowing and concede only if the text made the
position untenable. It conceded, and in doing so produced the distinction that settles it.

**The three paragraphs have different addressees.**

- **¶1 is driver-facing — a rule of *meaning*.** *"imposes a mandatory requirement **upon drivers of
  vehicles** … such line **shall have the significance** assigned to STOP sign R1. In any other
  circumstance STOP LINE markings shall have the significance assigned there to by STOP sign R1."*
- **¶2 is driver-facing — the fail-safe.** *"…as if they were still in position or functioning."*
  Counterfactual language, for when reality has departed from the design.
- **¶3 is authority-facing — a rule of *installation*.** Every verb is one only a road authority can
  perform: markings *"shall only be **used**"*, *"shall not be **used**"*, *"shall be **placed** on
  the road surface"*, *"shall be completely **removed**"*. A driver cannot use, place or remove a
  road marking.

An installation restriction cannot cut down a meaning rule, **because a driver's obligation does not
depend on whether the authority complied**. That is exactly why ¶1 carries a residual clause: to bind
the driver where ¶3 has been breached, or where the defect is not temporary — a sign permanently
stolen, a signal decommissioned, a line surviving a re-signing scheme.

Two further points defeat the narrow reading on its own terms:

- Reading *"in any other circumstance"* as coextensive with ¶2's two defect cases makes a mandatory
  *"shall"* into dead words. The drafter demonstrably knows how to write a restriction — ¶3 does it
  three times in four lines. ¶2 contains no limiting word at all.
- ¶3's *"only"* is contradicted **inside ¶3 itself**: the random-roadblock rule requires temporary
  RTM1 markings where there is neither an R1 nor a signal, only a traffic officer.

**Verdict: the client's original wording was right. Our narrowing was wrong.**

The salvageable half of our objection is pedagogical, not legal: a bare stop line is not a normal
designed control (¶3 forbids installing one that way), and the residual clause is a fail-safe against
defects rather than a general licence. Wording that is faithful to all three paragraphs:

> A stop line means stop — with your vehicle completely behind the line. Normally you meet one
> together with a STOP sign R1 or traffic signals, because that is the only way they are supposed to
> be installed. But if the STOP sign has been knocked down or is missing, or the signal is out of
> order, the line on its own still carries the full force of a STOP sign, and you must stop exactly as
> if the sign or red light were still there.

**Caveat carried forward:** the SADC RTSM is a design manual for road authorities. The binding duty on
a driver arises from the NRTA 93 of 1996 and its regulations. Per constraint 9 the citation on any
stop-line question should be the regulation, with §7.2.1 as supporting design context — and the
regulation's wording must not be assumed to track the manual's residual clause.


---

## 6. NRTR 2000 obtained — what the regulations settled (2026-07-30)

`resources/legislation/national-road-traffic-regulations-2000.pdf` — Government Gazette **No. 20963**, 17 March 2000
(GNR.225), 350 pp. Gitignored with the other sources.

The review above marked a large share of claims `NOT_VERIFIABLE_HERE` because the reviewers only had
the design manual. With the regulations in hand, **three of those reversals go in the drafts' favour**
— including one the review called unsafe.

### Vindicated — the draft was right and the reviewer could not have known

**`RM4.1` — reg 298A(2), verbatim:**
> "the driver of a motor vehicle may, during the period between sunrise and sunset, drive such motor
> vehicle on the shoulder of a public road which is designated for one lane of traffic in each
> direction— (a) while such motor vehicle is being overtaken by another vehicle; and (b) if he or she
> can do so without endangering himself or herself, other traffic, pedestrians or property on such
> public road; (c) if persons and vehicles upon a public road are clearly discernible at a distance of
> at least 150 metres."

Every element of our draft — sunrise-to-sunset, one lane each direction, only while being overtaken,
no endangerment, 150 m — is there and exact. The reviewer's separate catch still stands: the
*manual's* only "150" is 150 mm of lateral offset, a different quantity that shares the digits.

**`RM9` — reg 289, verbatim. The "fabricated permission" finding is WITHDRAWN:**
> "Where a regulatory sign applies which reserves a public road or portion of a public road for a
> specific category of vehicle, the driver of a vehicle, other than the driver of a vehicle of the
> class referred to by such sign, may only cross such public road, or the portion of such public road,
> if— (a) he or she cannot otherwise enter or leave any premises adjacent to such road or portion of
> public road; and (b) it is safe to do so."

The review called this "invented", "transplanted from the barrier-line exception" and "unsafe —
invites a learner to drive into a bus lane". It is none of those. The draft stated the rule correctly
**and cited reg 289 correctly**.

**`RTM3` — reg 315(4), verbatim:**
> "Whenever any vehicle is stopped at a pedestrian crossing to permit pedestrians to cross the
> roadway, the driver of any other vehicle approaching from the rear shall not pass such stopped
> vehicle."

The don't-overtake-a-stopped-vehicle rule and its citation are both correct.

### Reversal against the reviewer — the law is narrower than the manual

**`RTM3` / `RTM4` — reg 315(2):**
> "the driver of a vehicle shall yield the right of way, slowing down or stopping if need be to so
> yield **to a pedestrian crossing the roadway within a pedestrian crossing** when the pedestrian is
> upon that half of the roadway upon which the vehicle is travelling, or when the pedestrian is
> approaching so closely from the opposite half of the roadway as to be in danger."

The reviewer marked our "within the lines" wording as a wrong narrowing, because the *manual* places
no such limit and extends the duty to a pedestrian "waiting to cross". **The regulation does limit
it** — to a pedestrian *crossing within the crossing*, and further to the driver's own half of the
roadway or someone approaching closely enough to be in danger. There is no waiting-pedestrian duty
in reg 315.

Manual and regulation genuinely differ here. The regulation binds.

### A conflict between the manual and the law — resolve before writing any question

**`RTM2` yield-line width.**

| Source | Urban | Other |
|---|---|---|
| Manual §7.2.2 ¶4 | 300 mm | 500 mm |
| **Reg 286(2)(c)(ii)** | **200 mm** | **300 mm** |

The manual appears to have carried RTM1's figures into the RTM2 section — reg 286(2)(c)(i) gives
RTM1 as 300/500, matching §7.2.1 ¶4 exactly. **The regulation is the law.** Any question on yield-line
width must answer from reg 286(2)(c)(ii), not the manual.

Neither the original drafting nor a manual-only review would ever have caught this.

### Other citations now confirmed

- **reg 286(2)(c)(i)** — RTM1 300 mm urban / 500 mm other. Citation correct.
- **reg 286(2)(c)(iii)** — RTM4 2 400 mm, matching the manual's 2,4 m.
- **reg 286(2)(a)** — longitudinal markings minimum 100 mm. The manual's 150 mm for RM12 is a
  stricter design standard, not a contradiction.
- **reg 304** — confirms the RM12 drafting note: the stopping exceptions really do live here, not in
  the manual. *"Except in order to avoid an accident, or in compliance with a road traffic sign or
  with a direction given by a traffic officer, or for any cause beyond the control of the driver…"*
- **reg 305** — parking prohibitions; 305(1)(b) incorporates every place listed in reg 304.
- **reg 315(1)** — pedestrians must obey the signal where one is provided, matching the manual proviso
  the drafts omitted. That omission still stands.

### Still outstanding

**"Park" and "stop" are not defined in the regulations.** They are defined in the **National Road
Traffic Act 93 of 1996 s1**, which we do not have. So `RM13`'s entire "load and go" framing — the
claim that a genuine brief load or drop-off is not "parking" — remains unverified. That is the last
document needed to close the markings content.

### Net effect on section 2

Of the three "fabricated permissions", **one (`RM9`) is withdrawn entirely**. The other two stand:
`RM10`'s permission-to-*wait* in a box junction is still unsupported by anything found in either
document, and so is "the only legitimate reason to be sitting inside the box".

The lesson for the rewrite is not that the reviewers were unreliable — they flagged these correctly
as unverifiable rather than asserting them false, and said which document was needed. It is that
**a manual-only review cannot close a claim that rests on a regulation**, and roughly a third of this
content does.


---

## 7. NRTA 93 of 1996 obtained — the last outstanding claims resolved (2026-07-30)

`resources/legislation/national-road-traffic-act-93-of-1996.pdf` — Government Gazette **No. 17603**, 22 November 1996,
44 pp, from Parliament's own repository. Gitignored with the other sources.

(The RTMC copy is a 10-page notice, not the Act. SAFLII's consolidated PDF and HTML both return 403
to automated fetches.)

### The two definitions everything was waiting on

**s1(xlvi) "park"**, verbatim:
> "‘park’ means to keep a vehicle, **whether occupied or not**, stationary for a period of time longer
> than is reasonably necessary for the actual loading or unloading of persons or goods, **but does not
> include any such keeping of a vehicle by reason of a cause beyond the control of the person in charge
> of such vehicle**;"

**s1(lxix) "stop"**, verbatim:
> "‘stop’ means the bringing to a standstill of a vehicle by the driver thereof;"

**s1(lxvi) "shoulder"**, verbatim — relevant to RM4.1:
> "‘shoulder’ means that portion of a road, street or thoroughfare between the edge of the roadway and
> the kerb line;"

### What this resolves

**`RM13` — the "load and go" framing is CONFIRMED.** The draft's *"'Park' in law means keeping a
vehicle stationary for longer than is reasonably necessary to load or unload people or goods, so a
genuine brief load or drop-off is not parking"* tracks s1(xlvi) closely. The reviewer could only mark
it `NOT_VERIFIABLE_HERE`.

**`RM13` — the common mistake is CONFIRMED, and by the exact words the draft omitted.** *"Sitting in
the car with the engine running while you wait for a passenger is parking, not loading"* is supported
by **"whether occupied or not"**. Worth adding those four words to the content: they are the reason the
example works, and a learner who does not know them will not see why.

**`RM12` — "stopping is much wider than parking" is CONFIRMED.** "Stop" is *any* bringing to a
standstill; "park" additionally requires duration beyond what loading needs. The draft's *"bringing the
car to a standstill at all is already a contravention"* is right, and the red-vs-yellow strictness
comparison the reviewer called inference-only now rests on the two statutory definitions.

### One omission the Act adds, and it matters

Neither `RM12` nor `RM13` mentions the closing words of s1(xlvi): parking **does not include** keeping
a vehicle stationary *"by reason of a cause beyond the control of the person in charge"*. Stuck in
traffic, broken down, or held by a signal is not parking. Combined with reg 304's opening exception
(*"Except in order to avoid an accident, or in compliance with a road traffic sign or with a direction
given by a traffic officer, or for any cause beyond the control of the driver"*), the drafts state both
prohibitions more absolutely than the law does. Add it.

### Amendment caveat — read this before quoting the definitions

Section 1 has been amended three times: **Act 8 of 1998, Act 21 of 1999 and Act 64 of 2008**. Our copy
is the 1996 text as enacted, so it is not automatically the current wording.

What was checked: the **National Road Traffic Amendment Bill (2020)**, Gazette 43201 of 3 April 2020,
which proposes changes to section 1 *as already amended by all three Acts*. It touches "park" and
"stop" only by **insertion after** them — inserting *Passenger Rail Agency of South Africa* after
"park", and the *supplier of…* definitions after "stop". It does **not** substitute either definition.
That is consistent with both surviving unamended, and it means the Bill's own view of the consolidated
Act still contains them.

What was **not** checked: the three amendment Acts individually. Before a question ships on the
definition of "park" or "stop", confirm the wording against a consolidated text. Treat the quotes above
as the 1996 originals, corroborated but not proven current.

---

## 8. Where this leaves the markings content

Every claim the adversarial review could not close is now resolved except the amendment check above.
The tally has moved a long way from "sixteen for sixteen":

- **Confirmed correct by the regulations or the Act**, having looked wrong or unverifiable: `RM4.1`'s
  shoulder proviso (reg 298A), `RM9`'s premises access (reg 289), `RTM3`'s stopped-vehicle rule
  (reg 315(4)), `RM13`'s load-and-go and its engine-running example (NRTA s1(xlvi)), `RM12`'s
  stop-is-wider-than-park (s1(lxix) + s1(xlvi)), and RTM1/RTM4 marking widths (reg 286(2)(c)).
- **Still wrong and needing a fix**: `RM10`'s permission to *wait* in a box junction; the
  unconditional framings (`RM4.1` multi-lane, `RTM3`/`RTM4` signal proviso, `RM12`/`RM13` signed
  hours and the beyond-control exception); `RM7`'s loading-zone vehicle classes; `RM15`'s "flat
  paint" and the RM5 conflation; `RM1`'s "parked" for "stationary"; `RM8`'s single-direction claim;
  `RM5`'s boundary colour and missing third form; `RTM1`'s five unsourced conduct claims.
- **Genuine manual-vs-law conflict**: `RTM2` yield-line width — manual 300/500 mm, reg 286(2)(c)(ii)
  200/300 mm. The regulation binds.
- **Wrong across the whole library**: every citation says "SARTSM"; the manual is the **SADC** RTSM.

The rewrite is still the right call, but it is a narrower job than it looked: correct the conditions
and the citation strings, fix the dozen substantive errors, and add the statutory exceptions. The
underlying legal research was better than the review could show.

---

## 9. Direction: put the sources in a queryable store

Three primary sources now sit in `resources/`, all gitignored, all only reachable by a human opening a PDF:

| Document | File |
|---|---|
| SADC RTSM Vol 1 Ch 7 — Road Markings (May 2012) | `resources/sartsm/V1C7.pdf` |
| National Road Traffic Regulations 2000 (GG 20963) | `resources/legislation/national-road-traffic-regulations-2000.pdf` |
| National Road Traffic Act 93 of 1996 (GG 17603) | `resources/legislation/national-road-traffic-act-93-of-1996.pdf` |
| SADC RTSM Vol 4 Ch 9 — Information Signs | `resources/sartsm/V4C9.pdf` |
| DoT Road Traffic Signs chart (5 sheets) | `resources/charts/RTSigns_charts.pdf` |

**Agreed direction (John, 2026-07-30): publish these into a database so verification can cite them
directly rather than re-extracting a PDF each time.** Not built yet — recorded here so it is not
re-litigated.

Why it matters, concretely: this session's two worst errors were both *retrieval* failures, not
reasoning failures. The RM12/RM13 "fabrication" call was made without checking our own database, and a
third of the adversarial review returned `NOT_VERIFIABLE_HERE` purely because the regulations were not
on disk. A queryable store of regulation and section text, addressable by citation, removes both
failure modes — and it is the same infrastructure the question bank needs to satisfy constraint 9 at
800 items.

Shape worth considering when it is built: one row per addressable provision (`NRTA s1(xlvi)`,
`NRTR reg 298A(2)`, `SADC-RTSM §7.2.16(2)(b)`) carrying verbatim text, source document, page, and the
retrieval date — so a citation on a question resolves to text a human can read without opening a
350-page gazette.

**Correction (2026-07-30):** an earlier draft of this section said pgvector was "already wired for the
wiki search" in this project. It is not — there is no vector extension, no embedding column and no
`match_*` function anywhere in `supabase/migrations/` or `src/`. The reusable asset is the
`wiki-semantic-search` **pattern** (indexer → Supabase pgvector → RAG answer), proven on another
project and portable, not existing infrastructure here. Design notes: `docs/rag-source-retrieval.md`.

---

## 10. Rewrite applied — 2026-07-31

All 16 markings rewritten against the primary sources and applied as
`scripts/data-repairs/markings-content-2026-07-31.json` (one op per marking, idempotent, each
carrying the paragraph or provision it rests on in its `why`). **`review_status` stays `draft`** —
per constraint 9 an AI pass cannot approve its own work, so the human sign-off is still the gate.
The asset gate was untouched; it was already sound.

### What changed, by class of defect

| Class | Markings | Resolution |
|---|---|---|
| Fabricated permission | `RM10` | Permission to **enter** the box no longer reads as permission to enter *and wait*; "the only legitimate reason to be sitting inside the box" removed — ¶1 regulates entry, not presence |
| Fabricated permission | `RM9` | **No change** — the finding was already withdrawn once reg 289 was obtained; the draft stated the rule correctly |
| Conditions dropped | `RM12`, `RM13` | "In either case" removed: the broken form binds only during the signed hours. Both now carry reg 304's exceptions and s1(xlvi)'s "cause beyond the control" carve-out |
| Conditions dropped | `RTM3`, `RTM4` | Duty rewritten to reg 315(2) exactly, and the reg 315(1) pedestrian-signal proviso added |
| Wrong fact | `RM7` | Loading zone admits four vehicle categories, not one; B and MB no longer interchangeable; "on a fixed route" dropped |
| Wrong fact | `RM8` | "the only direction you are allowed" corrected — three of six variants permit two directions |
| Wrong fact | `RM15` | Circle is a painted island (`RM5`), not part of `RM15`; surface is recommended raised-but-mountable, not flat paint |
| Wrong fact | `RM1`, `RM2` | "parked" → "stationary" obstruction; the obstruction need not block the road |
| Wrong fact | `RM5` | Border is white **and/or yellow** and may be a kerb line or an RM4.1 edge line |
| Wrong fact | `RTM4` | It is the crossing's **length** that scales with pedestrian volume; blocks have a fixed 600 mm minimum width |
| Invented content | `RTM1` | All five unsourced conduct claims removed — front wheels, creeping forward, rocking back, pulling away when clear, and the worn-away-line advice |
| Missing content | `RM1`, `RM5`, `RM6`, `RM8`, `RM9`, `RM12`, `RM13`, `RTM2`, `RTM3` | WM8 arrows and the channelising-line lookalike; the third painted-island form; T-marks and corner marks; the GM3 bifurcation arrow; sign-not-paint and contra-flow; the kerb-face line; the not-on-freeways limit and no-line prohibition; the yield-line widths; the preceding stop or yield line |

### One finding reversed, against the manual and for the law

**`RM4.1`.** The review said three blocks wrongly dropped the manual's condition that the shoulder
prohibition applies only *"on a roadway with more than one lane in either or both directions"*
(§7.2.8 ¶1(a)). But **reg 298A(1) is general**: *"Subject to subregulation (2) and regulation 298 (1)
(e), no person shall drive a motor vehicle on the shoulder of a public road."* Carrying the manual's
condition into the learner-facing blocks would have taught that shoulder driving is fine on a
single-lane road. The unconditional framing therefore **stays**, and it is `formalMeaning` — the one
block that *did* carry the manual's condition — that was narrower than the law and has been corrected.

That is the second time on this library that the manual has been narrower or wider than the
regulation (`RTM2`'s width being the first). The rule holds: **where they differ, the regulation binds.**

### House style: citations do not belong in learner prose

A first pass of this rewrite put `reg 298A(1)`, `reg 304` and `reg 286(2)(c)(i)` inline in the
content. Checked against the library: **zero of fifty** approved sign rows carry a provision
reference in prose. The strings were removed and the substantive facts kept — the widths, the
exceptions, the definitions. The citation belongs in the repair file's `why`, which is the audit
trail, and in `verification`. This is worth knowing before the next content pass reintroduces them.

### What is still open

1. **Human sign-off.** 16 rows at `review_status='draft'`. Until they flip, no markings lesson is
   served — `isShippable()` requires both gates — and the Stage 1 markings gate in **K53-32** stays
   open. The UI is ready: `SIGN_CATEGORY_LABEL` and `SIGN_CATEGORY_ORDER` already carry `marking`.
2. **No markings questions exist.** The re-derived exam format (K53-34) puts markings at ~6 of 64,
   inside the signs section, so roughly 24 of the 65 outstanding signs-section questions should be
   markings. They cannot be written until the content above is approved.
3. **The amendment caveat at §7 still stands** for the `park` / `stop` definitions.

### Second pass — John's worksheet review, 2026-07-31

All 16 decided in `docs/markings-verify/index.html`, all as **edit**, none approved. The notes were
triaged against the primary sources; the accepted findings are folded into the same repair file, so
there is still one op per marking and it still replays from scratch.

**The pattern the review found was in the first rewrite, not the original drafts.** Pass 1 carried the
manual's conditions and the statutory exceptions into `formalMeaning` and left the neighbouring blocks
absolute — so four cards contradicted themselves, in exactly the class the July review named:

| Marking | `formalMeaning` said | The other blocks still said |
|---|---|---|
| `RM10` | turning vehicles may enter the box | "unless you can drive straight out the other side"; "No exit, no entry" |
| `RM12` | reg 304's exceptions apply | "bringing the car to a standstill **at all** is already a contravention"; "don't even pause" |
| `RM13` | not parking if stationary by a cause beyond your control | stop "**only if** you are genuinely busy loading" |
| `RM5` | — | "filled with yellow diagonal stripes" against a test hint warning that bars may be absent |

**Two regressions pass 1 introduced, both restored:** `RTM3` and `RTM4` lost §7.2.3(1)(a)/§7.2.4(1)(a)
— an accompanying sign, signal, stop line or yield line takes precedence — while the duty was being
rewritten to reg 315(2). `RTM2` lost the whole pedestrian-and-cyclist limb when only the manual's
"waiting to cross" extension should have gone.

**Two defects that pre-dated both passes:** `RM6` required that no "wheel, bumper or mirror" overhang a
bay line — an invented rule; the requirement is only that the vehicle be parked wholly within the
lines. `RM15` turned §7.2.19 ¶4's *recommendation* that the surface be raised into "often deliberately
raised", then added that mounting it is "neither intended nor comfortable", which inverts the reason
mountability is recommended.

**One finding rejected after checking the regulation, and it mattered.** The `RTM2` reviewer said the
200/300 widths were unsourced because reg 286(2)(c)(ii) is "a significance provision, not a dimensional
one". It is dimensional and it names the marking by code:

> "The **minimum width** of a transverse road marking shall be— … (ii) for road marking **RTM2** in an
> urban area, **200 millimetres** and in any other area **300 millimetres**"

The claim and its citation both stand. But the same words settle a real error next door: those are
**minima**, and both `RTM1` and `RTM2` stated their widths as exact. Fixed on both. This is the second
time on this library that checking a criticism against the source has confirmed the content *and*
found a different fault beside it.

Also rejected: `RM1`'s "Regulation 7.2.5(1)(a) and (b)" (no such regulation — §7.2.5 is a manual
section, the same confusion as the "§7.2.21" that turned out to be a page number) and its rewording of
"complete any overtaking before it begins" (a misreading — "it" is the line). `RM15`'s mini-circle
scoping point was rejected by its own reviewer and by us.

**Where the pass leaves it:** 16 markings, 0 approved, `review_status='draft'` throughout. Final
content is readable in `docs/road-markings-content.md`.
