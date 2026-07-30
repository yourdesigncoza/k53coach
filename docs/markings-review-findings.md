# Road markings — adversarial review findings (2026-07-30)

Sixteen independent reviewers, one per marking, each given the drafted content and the printed
manual page and told to **refute**, not confirm. Each verdict had to carry a verbatim quote or be
discarded. Reviewers were not shown the reasoning behind the drafts, only the drafts themselves —
and the drafting `confidence` notes were handed over as *claims to check*, not as context.

**Result: all 16 markings have defects. None is clean.** This document is the triage. It does not
replace the human pass — it tells that pass where to look.

Source of truth throughout: `init/V1C7.pdf` — **SADC** RTSM Vol 1 Ch 7, Road Markings (May 2012).

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
