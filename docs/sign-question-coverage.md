# Sign question coverage — the pick-list

Measured 2026-08-03 against the live bank. **375 signs are served; only 44 carry a
question. 331 have none.** Signs needs 41 more approved questions to clear the Stage 1
bar (currently 71 of 112).

This says which signs to write against — and warns that simply writing any 41 would clear
the count while still not matching the real paper.

## ⚠️ Read this before picking: our library and the real exam disagree

Across the 82 sign items indexed from real papers in `docs/exam-format-analysis/`.
Family shares are counted from each item's `subtopic`/`visual_desc`, since the observed
papers record signs visually and carry no sign codes — so these are family-level
evidence, not per-sign frequencies.

| Family the real paper tests | observed | what we hold |
|---|---|---|
| **Guidance / information** (green panels, route markers, tolls, exits) | **25 of 82 — biggest single family** | 24 served by category, **0 questions** |
| **Temporary / roadworks** (yellow signs, lane closures, chevrons) | **17 of 82** | **0 signs in the library at all** |
| Warning triangles | 8 | 102 served, 11 with questions |
| Command (blue circles) | 7 | 39 uncovered |
| Traffic signals | 7 | — |
| Reservation lanes | 6 | 81 uncovered |
| Prohibition | 4 | 47 uncovered |

Two conclusions:

1. **Guidance is the highest-value work and it is small.** The largest family in the real
   exam has zero questions, and only 16 `IN`-coded signs are uncovered. Cover them and we
   match the exam's heaviest section for very little effort.
2. **Temporary signs are missing from the library entirely** — no `T*` codes exist in
   `road_signs`. That is ~21% of observed sign items we cannot examine at all. A *content*
   gap, not a question gap; no amount of question-writing closes it. Worth its own issue.

Regulatory and warning are 89% of the library but only ~28% of observed sign questions.
That is where the easy volume is, and where over-indexing would flatter the count.

## 1. Guidance / information — do these first (16 signs, 0 questions)

Biggest real-exam family, shortest list.

| Code | Sign |
|---|---|
| `IN4` | Dead end |
| `IN5` | Dead end |
| `IN6` | Dead end |
| `IN7` | Priority road ahead |
| `IN10` | Park and Ride |
| `IN11.2` | Supplementary plate — distance (“for”) |
| `IN11.4` | Supplementary plate — text message |
| `IN11.3` | Supplementary plate — distance (“to”) |
| `IN11.1` | Supplementary plate — advisory speed |
| `IN12` | Information centre |
| `IN14` | Co-ordinated traffic signals at indicated speed |
| `IN15` | Multi-phase traffic signals |
| `IN16` | Bus stop ahead |
| `IN17` | Modal transfer point |
| `IN19` | Modal transfer |
| `IN20` | Right-of-way over oncoming vehicles |

> Note: `IN4`, `IN5` and `IN6` all carry the name "Dead end", and the `IN11.x` set are
> supplementary plates rather than standalone signs. Check these read distinctly before
> writing an item against each — a question needs the sign to be tellable apart.

## 2. Control signs — every learner must know these (10 signs)

Stop, yield and priority. Non-negotiable knowledge, high frequency.

| Code | Sign |
|---|---|
| `R1.1` | Stop. Two stop |
| `R1.2` | Stop. But drivers turning left must give way / yield |
| `R1.4` | Stop (4-way) |
| `R1.3` | Stop (3-way) |
| `R2.1` | Give Way / Yield to pedestrians |
| `R2.2` | Give Way / Yield at roundabout |
| `R4.2` | One-way roadway |
| `R4.3` | One-way roadway |
| `R5` | Pedestrian priority zone |
| `R6` | Give Way / Yield to oncoming traffic |

## 3. Command — blue circles (39 signs)

Observed 7 times. The "blue means you must" contrast is already taught well in the bank
(RS-003, RS-035), so these write quickly.

| Code | Sign |
|---|---|
| `R101-600` | End of minimum speed limit |
| `R102` | Vehicles exceeding 10 tonnes GVM only |
| `R104` | Keep Right |
| `R105` | Turn Left |
| `R106` | Turn Right |
| `R107` | Proceed Straight |
| `R109` | Turn right ahead |
| `R110` | Pedestrians only |
| `R111` | Cyclists only |
| `R112` | Cyclists and pedestrians only |
| `R113` | Cyclists and pedestrians only |
| `R114` | Cyclists and pedestrians only |
| `R115` | Cyclists and pedestrians only |
| `R116` | Motorcycles only |
| `R117` | Motorcars only |
| `R118` | Taxis only |
| `R119` | Mini-buses only |
| `R120` | Midi-buses only |
| `R121` | Buses only |
| `R122` | Delivery vehicles only |

*…and 19 more.*

## 4. Prohibition — red rings (47 signs)

| Code | Sign |
|---|---|
| `R201-5` | Speed limit of 5 km/h |
| `R201-10` | Speed limit of 10 km/h |
| `R201-70` | Speed limit of 70 km/h |
| `R201-75` | Speed limit of 75 km/h |
| `R201-120` | Speed limit of 120 km/h |
| `R201-30` | Speed limit of 30 km/h |
| `R201-100` | Speed limit of 100 km/h |
| `R201-90` | Speed limit of 90 km/h |
| `R201-50` | Speed limit of 50 km/h |
| `R201-20` | Speed limit of 20 km/h |
| `R201-40` | Speed limit of 40 km/h |
| `R202-600` | End of weight limit |
| `R202` | Vehicles exceeding 12 tonnes GVM prohibited |
| `R203` | Vehicles exceeding 2 tonnes on a single axle prohibited |
| `R205` | Vehicles exceeding 15 metres in length prohibited |

*…and 32 more.*

## 5. Warning triangles (91 signs)

Largest uncovered group, but only 8 of 82 observed items. Good for volume, poor for
matching the paper — take these last.

| Code | Sign |
|---|---|
| `W101` | Crossroad ahead |
| `W102` | Crossroad ahead with priority |
| `W103` | Crossroad ahead without priority |
| `W105` | Skewed T-junction ahead |
| `W106` | Skewed T-junction ahead |
| `W107` | Side-road junction ahead |
| `W108` | Side-road junction ahead |
| `W109` | Staggered side-road junctions ahead |
| `W110` | Staggered side-road junctions ahead |
| `W111` | Sharp junction ahead |
| `W112` | Sharp junction ahead |
| `W113` | Sharp junction ahead |
| `W114` | Sharp junction ahead |
| `W115` | Fork ahead |
| `W116` | Dual-carriageway ends ahead |

*…and 76 more.*

## Lowest priority

Reservation lanes (81) — observed 6 times, usually "which vehicle may use this lane".
Other R-codes (47) — mostly R5xx selective-restriction sub-plates, which rarely stand
alone as a question.

## How to use this

Every sign here already has verified, cited content in `road_signs`: the artwork is
chart-verified and the meaning is written. Writing a question is **not research** — it is
turning approved content into an item. Take the answer from the sign's own row, put the
provision in `source_citation`, and keep the explanation in learner voice (CLAUDE.md
constraint 10 — median 187 characters, teach the confusion, no reg numbers in the prose).

Regenerate this file by re-running the coverage query in `docs/verification-worklist.md`'s
sibling tooling; the counts drift as questions land.
