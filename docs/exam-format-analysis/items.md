# Item work-list — what the learner's test actually examines

**80 topic labels (~84 items)** recovered from 165 photographs of a live terminal,
plus **48 further labels** seen only in a third-party practice app.
**128 distinct topics** in total.

Each row records an item's *shape* — what it examines, how it is framed, what artwork it
needs. **No stems, options or answer keys are recorded.** See `question-patterns.md` for
what each `P#` means and `README.md` for provenance.

| column | meaning |
|---|---|
| `pattern` | construction pattern from `question-patterns.md` |
| `artwork` | asset required (`—` = text-only) |
| `pos` | position(s) held across sittings (terminal only — varies per sitting) |
| `code` | the bank's own item code (terminal only) |
| `src` | `T` = live terminal, `A` = third-party app only |

Item codes encode the bank's taxonomy: `2C##` controls, `2R###` rules, `25###` signs.
The bank files *vehicle-equipment law* under **rules** (`2R12`, `2R14`), reserving controls
codes for operating/identifying controls. Rules codes span `2R12`-`2R412`, implying a rules
pool in the hundreds — independent support for the 800-question Stage 2 target.

> **Priority: the markings table below.** We hold zero road markings, and `SignCategory`
> already has a `"marking"` value (`src/lib/types.ts:12`) — a content gap, not a schema change.

## Road markings — WE HOLD NONE (13 labels)

| # | topic label | pattern | artwork | pos | code | src |
|---|---|---|---|---|---|---|
| 1 | bus-lane | P4 | road-marking-diagram | 24 | 2544 | T |
| 2 | lane-reduction-from-right | P4 | road-marking-diagram | 52 | — | T |
| 3 | no-parking | P4 | road-marking-diagram | 53 | 1558,2558 | T |
| 4 | pedestrian-crossing | P5 | road-marking-diagram | 41 | 539 | T |
| 5 | railway-level-crossing | P4 | road-marking-diagram | 39 | 579 | T |
| 6 | railway-yield-marking | P4 | road-marking-diagram | 25 | — | T |
| 7 | reversible-lane | P4 | road-marking-diagram | 26 | — | T |
| 8 | yield-marking | P4 | road-marking-diagram | — | — | T |
| 9 | RT2-pedestrian-lines | P6 | road-marking-diagram | — | RT2 | A |
| 10 | ambulance-parking-bay | P4 | road-marking-diagram | — | — | A |
| 11 | lane-direction-arrows | P4 | road-marking-diagram | — | — | A |
| 12 | no-overtaking-barrier-lines | P4 | road-marking-diagram | — | — | A |
| 13 | parking-permitted | P4 | road-marking-diagram | — | — | A |

## Vehicle controls (12 labels)

| # | topic label | pattern | artwork | pos | code | src |
|---|---|---|---|---|---|---|
| 1 | accelerator-purpose | P10 | — | 49 | 2C71 | T |
| 2 | braking-distance | P6+P7 | controls-diagram | 44 | 2C88 | T |
| 3 | clutch-function | P10 | — | 49 | 2C68 | T |
| 4 | control-identification | P7 | controls-diagram | 48 | 2C50 | T |
| 5 | gear-selection | P7 | controls-diagram | 32,55 | 2C44 | T |
| 6 | heavy-vehicle-brakes | P10 | — | 45 | 2R12 | T |
| 7 | parking-brake | P10 | — | 7 | 2R14 | T |
| 8 | steering-control | P7 | controls-diagram | 56 | 2C89 | T |
| 9 | accelerator-identification | P6+P7 | controls-diagram | — | — | A |
| 10 | automatic-vs-manual-controls | P6+P7 | controls-diagram | — | — | A |
| 11 | hooter-identification | P7 | controls-diagram | — | — | A |
| 12 | sharp-curve-controls | P7 | controls-diagram | — | — | A |

## Signs (52 labels)

| # | topic label | pattern | artwork | pos | code | src |
|---|---|---|---|---|---|---|
| 1 | arrestor-bed | P1 | sign | — | — | T |
| 2 | chevron-barrier-board | P12 | sign | 60 | 342 | T |
| 3 | delivery-vehicle-left-turn | P12 | sign+plate | 20 | — | T |
| 4 | freeway-direction | P1 | sign | 47 | 2522 | T |
| 5 | high-speed-exit | P3 | sign | 61,63 | 2527,527 | T |
| 6 | information-sign-classification | P2 | sign | 48 | 1539 | T |
| 7 | keep-left-lane | P1 | sign | 62 | 25106 | T |
| 8 | lane-control-signal | P1 | signal | 18 | 25348 | T |
| 9 | minimum-speed-right-lane | P1 | sign | 50 | 2513 | T |
| 10 | motorcycle-reserved-lane | P1 | sign | 38 | 5301 | T |
| 11 | no-overtaking-goods-vehicle | P1 | sign | 34 | 5241 | T |
| 12 | no-stopping-checkerboard | P12 | sign | 58 | — | T |
| 13 | pedestrian-signal | P8 | signal | — | 25342 | T |
| 14 | regulatory | P1 | sign+plate | 20 | — | T |
| 15 | road-ends-T-junction | P1 | sign | — | — | T |
| 16 | roadworks-lane-closure | P1 | sign | 51 | 2514 | T |
| 17 | route-marker-alternative | P1 | sign | 13 | — | T |
| 18 | side-road-junction-warning | P1 | sign | 29 | — | T |
| 19 | stop-ahead-warning | P1 | sign | 54 | 25334 | T |
| 20 | temporary-sign-colour | P9 | — | 15 | — | T |
| 21 | temporary-sign-implication | P9 | — | 9 | — | T |
| 22 | temporary-sign-legal-significance | P9 | — | 26 | — | T |
| 23 | temporary-sign-purpose | P9 | — | 35 | 253 | T |
| 24 | temporary-signs | P9 | — | 15,26 | — | T |
| 25 | toll-route-marker | P1 | sign | 44 | — | T |
| 26 | traffic-light-camera | P1 | sign+robot | 33 | 2526,2528 | T |
| 27 | arrestor-bed-advance | P1 | sign | — | — | A |
| 28 | concealed-driveways-left | P1 | sign | — | — | A |
| 29 | cul-de-sac-right | P6 | sign | — | — | A |
| 30 | diplomatic-corps-reserved-parking | P1 | sign | — | — | A |
| 31 | engage-lower-gear-descent | P12 | sign | — | — | A |
| 32 | exit-sequence-guidance | P2 | sign | — | — | A |
| 33 | freeway-entry-toll-route | P12 | sign | — | — | A |
| 34 | freeway-exit-guidance | P1 | sign | — | — | A |
| 35 | freeway-split-lane-destinations | P1 | sign | — | — | A |
| 36 | lane-increase-ahead | P1 | sign | — | — | A |
| 37 | long-vehicle-prohibition-timeplate | P1 | sign+plate | — | — | A |
| 38 | mine-in-area | P1 | sign | — | — | A |
| 39 | national-park-tourism | P1 | sign | — | — | A |
| 40 | no-entry | P1 | sign | — | — | A |
| 41 | pedestrian-crossing-warning | P1 | sign | — | — | A |
| 42 | reservation-light-motor-vehicles | P1 | sign | — | — | A |
| 43 | reserved-lane-goods-over-10t | P1 | sign | — | — | A |
| 44 | rest-and-service-sequence | P1 | sign | — | — | A |
| 45 | road-narrows-both-sides | P1 | sign | — | — | A |
| 46 | roadworks-warning-distance-plate | P1 | sign+plate | — | — | A |
| 47 | robot-green-flashing-right-arrow | P6 | robot | — | — | A |
| 48 | staggered-junction-warning | P13 | sign | — | — | A |
| 49 | traffic-circle-ahead | P12 | sign | — | — | A |
| 50 | transport-modal-point | P1 | sign | — | — | A |
| 51 | transport-terminus-ship | P1 | sign | — | — | A |
| 52 | variable-message-sign | P1 | sign | — | — | A |

## Rules (51 labels)

| # | topic label | pattern | artwork | pos | code | src |
|---|---|---|---|---|---|---|
| 1 | body-protruding | P10 | — | 47 | — | T |
| 2 | cellphone-while-driving | P9 | — | 58 | 2R20 | T |
| 3 | crossing-public-road | P9 | — | 7 | — | T |
| 4 | documents | P10 | — | 58 | — | T |
| 5 | emergency-warning-signs-goods-vehicle | P9 | — | 28 | 2R129 | T |
| 6 | excessive-noise | P8 | — | 46 | 2R145 | T |
| 7 | exhaust-silencer | P10 | — | 23 | — | T |
| 8 | exhaust-silencer-heavy-vehicle | P9 | — | — | — | T |
| 9 | following-distance | P10 | — | 6,23,38 | 1157,2R157 | T |
| 10 | freeway-prohibited-vehicles | P10 | — | — | 2R172 | T |
| 11 | freeway-restrictions | P10 | — | — | — | T |
| 12 | headlights-when-required | P6 | — | 30,35 | 2R245 | T |
| 13 | heavy-vehicle-noise | P8 | — | 54 | 3143 | T |
| 14 | heavy-vehicle-speed-80 | P10 | — | 40,60 | 2R200 | T |
| 15 | lamps-when-switched-on | P9 | — | 8 | — | T |
| 16 | learner-licence-conditions | P6 | — | 21 | 2R159,2R198 | T |
| 17 | legal-stopping-places | P10 | — | 5,59 | 2R412 | T |
| 18 | lights | P9 | — | 8 | — | T |
| 19 | lights-parked | P6 | — | 17 | 29246 | T |
| 20 | lights-parked-vehicle | P6 | — | 17,33 | 2R245 | T |
| 21 | lights-when-switched-on | P9 | — | 19 | — | T |
| 22 | moving-off | P10 | — | 22 | — | T |
| 23 | no-stopping-area-parking | P10 | — | 64 | — | T |
| 24 | overtaking-prohibited | P10 | — | 27 | 9269 | T |
| 25 | parking-distance | P10 | — | 12 | — | T |
| 26 | parking-distance-from-edge | P10 | — | 37 | — | T |
| 27 | pedal-cycles-freeway | P8 | — | 30 | 175 | T |
| 28 | prohibited-acts | P6 | — | 57 | — | T |
| 29 | prohibited-acts-vehicle | P6 | — | 57 | 2R134 | T |
| 30 | refuelling-engine-off | P10 | — | 43 | 2R176 | T |
| 31 | robot-red-flashing-arrow | P11 | robot | 59 | 2508 | T |
| 32 | scenario-urban-right-turn | P11 | — | 64 | — | T |
| 33 | silencer-required | P8 | — | 46 | 2R154 | T |
| 34 | trailers-reflective-material | P9 | — | 1,61 | 2R242 | T |
| 35 | vehicle-equipment | P8 | — | 46 | — | T |
| 36 | vehicle-equipment-noise | P10 | — | 54 | — | T |
| 37 | vehicle-equipment-spotlamp | P8 | — | 10,52 | 2R205 | T |
| 38 | which-side-of-roadway | P10 | — | 14 | — | T |
| 39 | abandoned-vehicle-definition | P6 | — | — | — | A |
| 40 | alcohol-limit-professional-driver | P9 | — | — | — | A |
| 41 | blocking-intersection | P15* | — | — | — | A |
| 42 | carrying-learners-licence | P6 | — | — | — | A |
| 43 | driving-on-left-shoulder | P15 | — | — | — | A |
| 44 | fuel-tank-cap-roadworthiness | P9 | — | — | — | A |
| 45 | lane-change-procedure | P14 | — | — | — | A |
| 46 | officer-overrides-signs | P9 | — | — | — | A |
| 47 | reversing-distance | P6 | — | — | — | A |
| 48 | speed-limit-when-overtaking | P15* | — | — | — | A |
| 49 | stopping-prohibited-places | P6 | — | — | — | A |
| 50 | traffic-circle-right-of-way | P6 | — | — | — | A |
| 51 | windscreen-wiper-requirement | P10 | — | — | — | A |

