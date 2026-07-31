# Road markings — the written library

All 16 markings, final content as at **2026-07-31**. Two rewrite passes on top of the original
drafts: the first against the SADC RTSM Vol 1 Ch 7 manual, the NRTR 2000 and the NRTA 93 of 1996
after an adversarial review found defects in all sixteen; the second from John's worksheet review.
Every change is recorded op-by-op in `scripts/data-repairs/markings-content-2026-07-31.json`,
and the defect-by-defect account is in `docs/markings-review-findings.md` §10.

> **Status: `review_status = 'draft'` on all 16.** Nothing here is served to learners yet.
> An AI pass cannot approve its own work, so the human sign-off is the gate —
> `docs/markings-verify/index.html`, then
> `node scripts/signs/markings/apply-marking-verification.mjs --by "<name>" --apply`.

---

## Transverse markings — lines across your lane

### `RTM1` — Stop line

*transverse*

**Plain English**  
A solid white line painted across your lane telling you exactly where to stop — your car must come to a complete standstill just behind it, not on it.

**Formal meaning**  
A regulatory transverse marking that, with a Stop sign R1, a red traffic signal or a traffic officer's signal, requires the driver to stop completely immediately behind the line and not move off until it is safe. At a junction, where the R1 sign has fallen down or the signal is out of order, the line carries the full force of the Stop sign on its own.

**What the driver must do**  
Bring the vehicle to a complete standstill immediately behind the line — not on it and not beyond it — and move off only when it is safe to do so.

**Common mistake**  
Rolling slowly over the line instead of stopping behind it first, or stopping level with the Stop sign when a line is painted further back. The line is where you stop.

**Test hint**  
A stop line is white, solid, and runs across your lane: at least 300 mm wide in an urban area and at least 500 mm elsewhere. Expect the contrast with the yield line RTM2, which is broken.

**Memory trick**  
Stop behind the line, not on it. The line is a wall, not a target.

---

### `RTM2` — Yield line

*transverse*

**Plain English**  
A broken white line across your lane that means give way here — you do not have to stop if the way is genuinely clear, but everyone else goes first.

**Formal meaning**  
A regulatory transverse marking requiring the driver to yield right of way at the line to traffic on the road being joined, to rail traffic on a railway crossing, and to pedestrians and cyclists crossing at a marked crossing. It carries the significance of Yield sign R2, including where that sign has fallen down. It is broken, and at least 200 mm wide in an urban area and at least 300 mm elsewhere.

**What the driver must do**  
Slow right down as you approach, look both ways and be ready to stop; only cross the line when you can go without making anyone else slow down, swerve or stop.

**Common mistake**  
Treating a yield line as 'slow down a bit and squeeze in' — yielding means the other road user keeps their speed and line, not that you force them to adjust.

**Test hint**  
Questions contrast the two: solid across the lane is a stop line, broken across the lane is a yield line. Widths differ too — a yield line is at least 200 mm urban / 300 mm elsewhere, against the stop line's 300/500. Note that some published material gives 300/500 for a yield line as well; the legal figures are 200/300.

**Memory trick**  
Broken line, broken journey — the gaps in the line are the gaps in traffic you are waiting for.

---

### `RTM3` — Pedestrian crossing lines

*transverse*

**Plain English**  
Two solid white lines running across the road with a gap between them — that gap is a walkway for people, and a person walking across it has right of way over you.

**Formal meaning**  
A regulatory marking requiring a driver to yield right of way, slowing down or stopping if need be, to a pedestrian crossing the roadway within the crossing — when that pedestrian is on the driver's half of the roadway, or is approaching so closely from the other half as to be in danger. Where the crossing is used with a road sign, a traffic signal, a stop line or a yield line, that control takes precedence. Where a pedestrian signal is provided, the pedestrian must obey it.

**What the driver must do**  
Scan both pavements as you approach and be ready to stop for anyone already stepping across, especially on your side of the road. Stop at the stop line or yield line painted before the crossing, not on the crossing itself. If another vehicle has already stopped at the crossing, do not overtake it.

**Common mistake**  
Learners confuse this with the thick painted blocks, which is a different marking (RTM4). The other error runs the opposite way to what you might expect: the duty in law is to a pedestrian who is crossing, not to one standing at the kerb who has not started.

**Test hint**  
Expect a question on whether you may pass a vehicle stopped at a crossing. The answer is no. One divergence worth knowing: the marking manual says the duty extends to a pedestrian waiting to cross, while the regulation limits it to a pedestrian actually crossing. Learn the regulation, but expect test material drawn from the manual to say otherwise.

**Memory trick**  
Two lines = a corridor with two walls. Walls are for walkers, so wait for the walkers.

---

### `RTM4` — Block pedestrian crossing

*transverse*

**Plain English**  
A row of fat white painted blocks across the road — the high-visibility pedestrian crossing you see outside schools, malls and stadiums.

**Formal meaning**  
A regulatory marking with the same force as pedestrian crossing lines: a driver must yield right of way, slowing down or stopping if need be, to a pedestrian crossing the roadway within the crossing when that pedestrian is on the driver's half of the roadway or approaching so closely from the other half as to be in danger. Where the crossing is used with a road sign, a traffic signal, a stop line or a yield line, that control takes precedence. Where a pedestrian signal is provided, the pedestrian must obey it. Pedestrians must cross within the marked area.

**What the driver must do**  
Ease off well before the blocks, cover the brake, and give way to anyone already crossing. Stop at the stop line or yield line before the crossing — never with your vehicle sitting on the blocks.

**Common mistake**  
Assuming the blocks are speed bumps — they are flat paint, laid out in blocks so the crossing is visible from a distance. Learners also over-state the duty: in law it runs to a pedestrian who is crossing, not to one still standing at the kerb.

**Test hint**  
It is a yield-to-pedestrians control, so the duty is to give way, not merely to slow down. One divergence worth knowing: the marking manual says the duty extends to a pedestrian waiting to cross, while the regulation limits it to a pedestrian actually crossing. Learn the regulation, but expect test material drawn from the manual to say otherwise.

**Memory trick**  
Big blocks, big brakes. Where more people cross, the blocks are made longer.

---

## Longitudinal markings — lines along the road

### `RM1` — No Overtaking Line

*longitudinal*

**Plain English**  
A single solid white line down the middle of a two-way road means stay on your side of it: do not cross it, and do not overtake.

**Formal meaning**  
Where a single continuous solid white line separates traffic travelling in opposite directions, a driver may not drive on the right side of it and no part of the vehicle may cross it. Three narrow exceptions apply, and only when it is safe to do so.

**What the driver must do**  
Keep left of the line and complete any overtaking before it begins. You may cross it only to enter or leave property on the other side, or to get past a stationary obstruction in the road, and only when it is safe.

**Common mistake**  
Learners assume a solid line can never be crossed for any reason. It bans overtaking, but you may still turn across it into or out of a property when it is safe.

**Test hint**  
Expect a question on the three exceptions, and on whether you may turn right across it (yes, to reach or leave property). It is white, continuous, and at least 100 mm wide. Two traps: the WM8 arrows painted further back are the 'no overtaking line ahead' warning, not the line itself; and an identical-looking solid white line may be a channelising line, which is a different marking doing a different job.

**Memory trick**  
Single Solid = Stay on your Side. Only property access or a stationary obstruction lets you cross it.

---

### `RM2` — No Crossing Lines

*longitudinal*

**Plain English**  
Two solid white lines side by side are a wall: you may not cross them — so no overtaking, and no turning across them either.

**Formal meaning**  
Two continuous solid white lines, each at least 100 mm wide. A driver may not drive on the right side of them and no part of the vehicle may cross them, unless passing a stationary obstruction in the roadway and it is safe to do so.

**What the driver must do**  
You may not cross the lines. That rules out overtaking, and it rules out turning right across them into or out of a side road or driveway. The only time you may cross is to pass a stationary obstruction in the roadway, and only when it is safe — the obstruction does not have to be blocking the road completely.

**Common mistake**  
Carrying the property-access exception over from the single no-overtaking line. Double lines are stricter: they ban the turn as well as the overtake.

**Test hint**  
The classic trap is one line versus two. One line still permits access to property; two lines permit only passing a stationary obstruction.

**Memory trick**  
Two lines = Do Not Cross. Everything else follows from that: no overtaking, no turning across.

---

### `RM4.1` — Left Edge Line

*longitudinal*

**Plain English**  
The solid yellow line along the left edge marks the shoulder, and the shoulder is not a normal traffic lane.

**Formal meaning**  
A continuous solid yellow line at least 100 mm wide marking the left edge of the roadway; the shoulder is the strip between that edge and the kerb line. The line identifies the shoulder — the prohibition comes from the road traffic regulations, which forbid driving a motor vehicle on the shoulder of a public road except in one narrow daytime case, and never in order to overtake. For an emergency stop you must make every reasonable effort to bring the vehicle fully to the left of the line.

**What the driver must do**  
Keep to the right of the yellow line. On a road with one lane in each direction you may move onto the shoulder to let a faster vehicle pass, but only between sunrise and sunset, only if you endanger nobody, and only when people and vehicles are clearly discernible at least 150 m away.

**Common mistake**  
Treating the yellow line as a permanent slow lane. Driving on the shoulder is prohibited by default, the courtesy move is a narrow daytime exception, and you may never overtake on the shoulder.

**Test hint**  
The numbers get asked: yellow, minimum 100 mm, sunrise to sunset, 150 m visibility, and only while you are being overtaken.

**Memory trick**  
Yellow = Yield space, not Your lane. Daylight + 150 m + being overtaken is the only time you may use it.

---

### `RM5` — Painted Island

*island*

**Plain English**  
The marked-off painted area is out of bounds: do not drive on it, stop on it or park on it. It usually carries yellow diagonal stripes, but not always.

**Formal meaning**  
An area enclosed by a boundary line or lines, white and/or yellow, normally filled with yellow sloping bars in a diagonal or chevron pattern. One boundary may be formed by a kerb line or by a yellow RM4.1 edge line rather than painted separately. No part of a vehicle may enter the painted island, and no vehicle may stop or park on it, except when directed by a traffic officer or in the case of an emergency.

**What the driver must do**  
Pass it on the correct side and keep every wheel off the paint. Enter it only on a traffic officer's direction or in a genuine emergency.

**Common mistake**  
Using a painted island as a waiting space for a gap, or clipping its corner while turning. Both are offences even though the island is only paint — and because no part of the vehicle may enter it, a single wheel is enough.

**Test hint**  
There are exactly two exceptions: a traffic officer's direction and an emergency. Note that stopping and parking are banned too, not just driving over it. Do not rely on the diagonal bars to recognise one — a painted island may also be two solid white lines enclosing a plain solid yellow area, with no bars at all.

**Memory trick**  
Stripes mean no-go. Only an Officer or an Emergency gets you on.

---

### `RM8` — Mandatory Direction Arrows

*arrows*

**Plain English**  
A yellow arrow painted in your lane tells you which way you must go from that lane. Some arrows show one direction, others show two — you must take one of the directions shown.

**Formal meaning**  
Yellow arrows (variants RM8.1 to RM8.6) marked in a traffic lane, imposing a mandatory requirement to proceed only in a direction the arrow indicates. They are most often seen on the approach to a junction, but may be used wherever lane movements are controlled. Three of the six variants show a single direction and three show a choice of two; where two are shown, either is permitted and nothing else is.

**What the driver must do**  
Read the arrow early and get into the correct lane well before the junction. Once you are in the lane, take only the direction shown, even if the queue next to you is shorter.

**Common mistake**  
Treating the arrow as a suggestion, or changing lanes at the last second. The direction is compulsory, and the warning arrows further back are your cue to move over.

**Test hint**  
Colour is the trap: these arrows are yellow, not white. Six variants exist — left, left-or-straight, straight, right-or-straight, right, and right-or-left — so 'the arrow always shows exactly one direction' is a wrong answer. A white arrow at a point where the road splits is the GM3 bifurcation arrow, which tells you where the lanes go; it is not an instruction.

**Memory trick**  
Yellow arrow, no choice beyond what it points at — and it may point two ways.

---

### `RM15` — Traffic Circle Mandatory Direction Arrows

*arrows*

**Plain English**  
At a mini circle, three yellow arrows and a painted circle tell you to go round clockwise, keeping the circle on your right.

**Formal meaning**  
Three yellow arrows marked around the circle at a mini circle, imposing a mandatory requirement to proceed only in the direction the arrows indicate. RM15 is the arrows; the marked circle itself is a form of painted island, marking RM5. The road surface over the circle is recommended to be raised but mountable. Drivers must not encroach on the circle, fully cover it, or pass to the right of it.

**What the driver must do**  
Follow the arrows clockwise around the circle so it stays on your right. Do not drive straight over the painted circle or turn in front of it.

**Common mistake**  
Driving over the circle as though it were ordinary paint, or cutting right in front of it when turning right. Both break the mandatory direction.

**Test hint**  
Learn the colours and the direction: arrows yellow, outer circle white, inner circle yellow, and you travel clockwise with the circle on your right. Note the codes are split — the arrows are RM15, the circle is a painted island RM5.

**Memory trick**  
Clockwise, circle on your right. Never cut the clock in half.

---

## Parking, restriction and reserved-lane markings

### `RM6` — Parking Bays

*parking*

**Plain English**  
White lines marking out one parking space — your whole car has to fit inside them. The space is often marked only by T-shapes or corner marks rather than a full box, but it is the same bay.

**Formal meaning**  
A white line marking, at least 100 mm wide, defining the limits of a single parking bay. A driver must park wholly within those lines, and where the bays are angled to the kerb, end up within 150 mm of the kerb line. Where the road has no kerb, the vehicle must be parked as far forward onto the verge as possible without encroaching on the sidewalk.

**What the driver must do**  
Position the vehicle wholly within the marked bay, and on angled bays finish within 150 mm of the kerb. Never straddle two bays or leave the tail sticking out into the traffic lane.

**Common mistake**  
Learners assume 'close enough' is good enough. The requirement is that the vehicle sits wholly inside the lines, so a wheel over the line means it is no longer wholly within the bay.

**Test hint**  
Watch for the word 'wholly' or 'completely' in the answer options — that is the correct one. An ordinary parking bay is white, which is what separates it from the yellow exclusive bay. Do not be caught by the shape: T-marks and corner marks define a bay just as a closed box does.

**Memory trick**  
White marks, whole vehicle — whatever shape the paint, the whole vehicle sits inside.

---

### `RM7` — Exclusive Parking Bay

*parking*

**Plain English**  
A bay outlined in yellow with letters inside a yellow oval. The letters tell you who may use it — unless your vehicle or your situation matches, you may not park there or even stop.

**Formal meaning**  
A bay demarcated by a continuous solid yellow line on three sides, carrying an oval marking RM7.1 with one or more designatory letters. No driver may park or stop inside it unless the vehicle is of the class the letters indicate. The letters are A ambulance, B bus, L loading zone, T taxi, F fire-fighting, R rickshaw, CD diplomatic, MB minibus, SOS emergency telephone, D defence force, P police. At an SOS bay no vehicle may park or stop except in an emergency.

**What the driver must do**  
Read the oval before you switch off the engine. In a loading zone (L) the bay is open to a goods vehicle, and also to a motorcycle, motor tricycle or motor quadrucycle designed or adapted to convey goods — but to nothing else, and only for as long as loading reasonably takes. A B bay is for a bus and an MB bay is for a minibus; they are not interchangeable.

**Common mistake**  
Learners read it as 'no parking, but a quick stop is fine'. The prohibition covers stopping as well as parking. The other error is assuming an 'L' loading bay is open to anyone with something to carry — it is limited to goods vehicles and goods-carrying motorcycles and tricycles.

**Test hint**  
Colour is the discriminator: an ordinary parking bay is white, an exclusive parking bay is yellow with a lettered oval. Expect a question giving a letter and asking which vehicle may use the bay.

**Memory trick**  
Yellow bay, letter of the day — if the letter isn't yours, drive away.

---

### `RM9` — Exclusive Use Lane Line

*reserved-lane*

**Plain English**  
A broken yellow line down the side of a lane means that lane is reserved — only the vehicle painted in it (bicycle, BUS, TRAM or high-occupancy vehicle) may use it.

**Formal meaning**  
A broken yellow line at least 150 mm wide, used together with an exclusive use symbol or word marking RM17 and the matching reservation sign. It is the sign that reserves the lane — the line marks where the reservation runs. Drivers of any other class of vehicle may not drive, stop or park in that lane. Where a selective-restriction sign is used, the reservation applies only during the hours the sign shows.

**What the driver must do**  
Stay out of the lane unless your vehicle is the class shown by the symbol or word. If crossing the lane is the only way to enter or leave premises next to the road, you may cross it — but only when it is safe.

**Common mistake**  
Learners read the broken line as permission, the way a broken white lane line is. Here the gaps are just how the boundary is drawn, not an invitation to use the lane.

**Test hint**  
Colour plus symbol is the tell: a yellow broken line with a bicycle, the word BUS or TRAM, or an HOV symbol inside it. Two things catch learners out — the reserving authority is the sign, not the paint, and a contra-flow reserved lane carries its traffic in the OPPOSITE direction to the rest of the roadway.

**Memory trick**  
Yellow dashes, someone else's lane.

---

### `RM10` — Box Junction

*restriction*

**Plain English**  
A yellow criss-crossed box at an intersection: do not drive in unless you can expect to clear it. Vehicles turning left or right may enter.

**Formal meaning**  
Continuous yellow boundary lines enclosing yellow cross-hatched diagonals, all at least 100 mm wide. A driver may not enter the box-marked area if stationary vehicles ahead mean they will not be able to leave it. Vehicles turning left or turning right may enter the box.

**What the driver must do**  
Look past the box before you move off. If the traffic beyond it is standing still and there is no gap for you on the far side, wait behind the box. The rule bites at the moment you enter: do not enter unless you can expect to clear it.

**Common mistake**  
Two errors. The first is reading it as 'you may never stop here', when the actual rule is about whether you could leave when you entered. The second is assuming that being inside the box is itself the offence — a driver who entered lawfully and was then held up has broken nothing.

**Test hint**  
The correct answer is phrased around being able to leave or clear the box at the point of entry, not around stopping in general.

**Memory trick**  
Blocked exit? Don't enter — unless you are turning.

---

### `RM12` — No Stopping Line

*restriction*

**Plain English**  
A red line along the edge of the road means you may not stop there at all — not even for a few seconds to let someone out.

**Formal meaning**  
A red line marked along the kerb or road edge, and it may be marked on the kerb itself rather than on the road surface. A continuous solid red line at least 150 mm wide applies 24 hours a day; a broken red line, at least 100 mm wide, applies only during the times shown on the accompanying road sign. Where it applies, a driver may not stop a vehicle next to it — except to avoid an accident, in compliance with a road traffic sign or a traffic officer's direction, or for any cause beyond the driver's control.

**What the driver must do**  
Keep moving. Do not stop to drop off or pick up a passenger, take a call, check a map or load anything. Being held up by traffic, a signal or a breakdown is not a contravention — the rule is aimed at stopping by choice. If you need to stop, find the nearest place where stopping is allowed.

**Common mistake**  
Learners think a red line only bans parking. Stopping is much wider than parking — voluntarily bringing the car to a standstill is already a contravention, which is why the red line is stricter than the yellow one.

**Test hint**  
Learn the pair together: red governs stopping, yellow governs parking. Then the second axis: solid means all day, broken means only during the hours on the sign. Look at the kerb as well as the road surface — the line may be marked on the kerb itself.

**Memory trick**  
Red means no voluntary stop; yellow means no parking.

---

### `RM13` — No Parking Line

*restriction*

**Plain English**  
A yellow line along the edge of the road means don't leave your car there — you may only stop long enough to load or unload people or goods.

**Formal meaning**  
A yellow line marked along the kerb or road edge. A continuous solid yellow line at least 100 mm wide applies 24 hours a day; a broken yellow line applies only during the times shown on the accompanying road sign. 'Park' in law means keeping a vehicle, whether occupied or not, stationary for longer than is reasonably necessary to load or unload people or goods — so a genuine brief load or drop-off is not parking, and neither is being kept stationary by a cause beyond your control.

**What the driver must do**  
Do not leave your vehicle standing next to the line. You may stop for as long as is reasonably necessary to load or unload people or goods, then pull away. Waiting for someone counts as parking.

**Common mistake**  
Learners treat the yellow line as a free waiting bay. The definition of parking covers a vehicle 'whether occupied or not', so sitting in the car with the engine running while you wait for a passenger is parking, not loading, and it breaks the rule.

**Test hint**  
Expect a straight red-versus-yellow comparison: red bans stopping outright, yellow bans parking but allows genuine loading. Two extras worth knowing: this marking is used on urban roadways at the general urban speed limit, not on freeways, and parking can be prohibited by a sign where there is no line painted at all.

**Memory trick**  
Yellow means load and go.

---

