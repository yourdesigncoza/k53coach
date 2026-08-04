/**
 * Draw the 16 road markings as consistent square road-surface tiles.
 *
 *   node scripts/signs/markings/draw-markings.mjs [--out public/markings-v2]
 *
 * WHY THIS EXISTS: the shipped markings were vector-extracted from the DoT
 * chart's own vignettes, so every one is a grey ELLIPSE — the chart's drawing
 * convention, not the marking. Alongside 340 rectangular/triangular/circular
 * sign plates they read as a foreign object, several are double ovals cropping
 * badly at thumbnail size, and incidental chart furniture came with them (green
 * verge fill, a STOP legend on RTM1). See K53-37.
 *
 * These are DRAWN TO THE WRITTEN SPECIFICATION, not traced. Every geometry
 * below cites the SARTSM provision that fixes its colour, continuity and
 * minimum width, and the citation is emitted into each SVG's <desc> so the file
 * carries its own evidence. That is a stronger basis than tracing a vignette:
 * the manual gives millimetres, the vignette gives a picture of millimetres.
 *
 * SCALE IS DELIBERATELY NOT TRUE. The tile spans ~7.4 m of roadway, so a 100 mm
 * line would be 3 px at 240 and a quarter of a pixel in the 48 px library
 * thumbnail — invisible. Line weights are therefore boosted by WEIGHT below,
 * which preserves RELATIVE thickness (a 300 mm stop line still reads as much
 * fatter than a 100 mm edge line) while staying legible small. Pictograms have
 * always done this; the official chart does it too.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const outArg = process.argv.indexOf("--out");
const OUT = join(ROOT, outArg > -1 ? process.argv[outArg + 1] : "public/markings-v2");

// ── Design tokens ────────────────────────────────────────────────────────────
// Sampled from the reference tile John approved (2026-08-04).
const S = 240; // square viewBox — same aspect for all 16, per K53-37
const ROAD = "#93938E";
const WHITE = "#F7F7F6";
const YELLOW = "#EECA1A";
const RED = "#CC2229"; // no-stopping line; the chart's red, kept distinct from the sign reds
const ARROW = "#1F1F1F"; // direction-of-travel legend

/** Millimetres → drawn pixels. Monotonic, so relative thickness survives. */
const WEIGHT = { 100: 6, 150: 8, 300: 13, 500: 18, 600: 22 };
const w = (mm) => WEIGHT[mm] ?? 6;

// ── Primitives ───────────────────────────────────────────────────────────────
const road = () => `<rect width="${S}" height="${S}" fill="${ROAD}"/>`;

/** Vertical line (runs with the direction of travel). */
const vline = (x, { mm = 100, fill = WHITE, dash = null, y1 = 0, y2 = S } = {}) =>
  `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${fill}" stroke-width="${w(mm)}"${
    dash ? ` stroke-dasharray="${dash}"` : ""
  }/>`;

/** Horizontal line (runs across the roadway). */
const hline = (y, { mm = 100, fill = WHITE, dash = null, x1 = 0, x2 = S } = {}) =>
  `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${fill}" stroke-width="${w(mm)}"${
    dash ? ` stroke-dasharray="${dash}"` : ""
  }/>`;

/** The broken centre line, drawn for context on tiles where it aids reading. */
const centreLine = (opts = {}) => vline(S / 2, { dash: "22 18", ...opts });

/** Direction-of-travel legend, bottom right. Kept from the approved reference:
 *  placed deliberately and identically on every tile, so it reads as a key
 *  rather than as the chart crop-artifact it replaces.
 *
 *  It sits on a road-coloured pad so a marking running underneath it is masked
 *  rather than colliding — RM12/RM13 put a line on each kerb, and the right-hand
 *  one ran straight through the arrow. Masking keeps the badge in the identical
 *  place on all 16 rather than moving it on the two tiles that would clash. */
const dirArrow = () =>
  `<rect x="196" y="200" width="34" height="34" rx="7" fill="${ROAD}"/>` +
  `<path d="M213 206 L204 228 L222 228 Z" fill="${ARROW}"/>`;

/** Yellow hatching clipped to a shape — painted islands and box junctions. */
const hatch = (id, { fill = YELLOW, gap = 24, angle = 45 } = {}) =>
  `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">` +
  `<rect width="${gap / 3}" height="${gap}" fill="${fill}"/></pattern>`; // 1:2 bar:space per §7.2.9

/** Straight-ahead lane arrow, tip at (x, yTip). */
const arrowStraight = (x, yTip, yTail, fill = YELLOW) =>
  `<path d="M${x} ${yTip} l-15 26 h8 v${yTail - yTip - 26} h14 v-${yTail - yTip - 26} h8 Z" fill="${fill}"/>`;

/** Left-turn lane arrow rising from (x, yTail) then hooking left. */
const arrowLeft = (x, yTail, fill = YELLOW) =>
  `<path d="M${x - 7} ${yTail} v-58 q0-20 -20-20 h-8 v-11 l-26 20 l26 20 v-11 h6 q8 0 8 8 v52 Z" fill="${fill}"/>`;

// ── The 16 markings ──────────────────────────────────────────────────────────
// Each `draw` returns SVG body. `check` is the dimensioned claim the drawing
// must satisfy; it is what a human verifies the picture against.
const MARKINGS = [
  {
    code: "RM1",
    name: "No Overtaking Line",
    cite: "SARTSM Vol 1 §7.2.5",
    check: "White, continuous, minimum 100 mm wide, down the centre of a two-way road.",
    draw: () => road() + vline(S / 2, { mm: 100 }) + dirArrow(),
  },
  {
    code: "RM2",
    name: "No Crossing Lines",
    cite: "SARTSM Vol 1 §7.2.6",
    check: "Two continuous solid white lines, each minimum 100 mm wide.",
    draw: () =>
      road() + vline(S / 2 - 9, { mm: 100 }) + vline(S / 2 + 9, { mm: 100 }) + dirArrow(),
  },
  {
    code: "RM4.1",
    name: "Left Edge Line",
    cite: "SARTSM Vol 1 §7.2.8; NRTR 2000 reg 298A(1)-(2)",
    check: "Continuous solid YELLOW line, minimum 100 mm wide, marking the LEFT edge of the roadway. Centre line shown broken for context.",
    draw: () => road() + vline(26, { mm: 100, fill: YELLOW }) + centreLine() + dirArrow(),
  },
  {
    code: "RM5",
    name: "Painted Island",
    cite: "SARTSM Vol 1 §7.2.9",
    check: "White boundary lines minimum 100 mm wide enclosing yellow sloping bars, minimum 150 mm wide, bar-to-space ratio 1:2.",
    draw: () =>
      `<defs>${hatch("rm5")}<clipPath id="rm5c"><path d="M120 26 L152 74 V166 L120 214 L88 166 V74 Z"/></clipPath></defs>` +
      road() +
      `<g clip-path="url(#rm5c)"><rect width="${S}" height="${S}" fill="url(#rm5)"/></g>` +
      `<path d="M120 26 L152 74 V166 L120 214 L88 166 V74 Z" fill="none" stroke="${WHITE}" stroke-width="${w(100)}"/>` +
      dirArrow(),
  },
  {
    code: "RM6",
    name: "Parking Bays",
    cite: "SARTSM Vol 1 §7.2.10; NRTR 2000 reg 305",
    check: "White lines minimum 100 mm wide defining the limits of each bay. Driver must park wholly within them.",
    draw: () =>
      road() +
      vline(96, { mm: 100 }) +
      [40, 112, 184].map((y) => hline(y, { mm: 100, x1: 8, x2: 96 })).join("") +
      dirArrow(),
  },
  {
    code: "RM7",
    name: "Exclusive Parking Bay",
    cite: "SARTSM Vol 1 §7.2.11 (RM7, RM7.1)",
    check: "Bay demarcated by a continuous solid YELLOW line on three sides, carrying oval marking RM7.1 with a designatory letter.",
    draw: () =>
      road() +
      `<path d="M14 52 H104 V188 H14" fill="none" stroke="${YELLOW}" stroke-width="${w(100)}"/>` +
      `<ellipse cx="59" cy="120" rx="26" ry="19" fill="none" stroke="${YELLOW}" stroke-width="5"/>` +
      `<text x="59" y="128" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="bold" fill="${YELLOW}" text-anchor="middle">A</text>` +
      centreLine({ y1: 0, y2: S }) +
      dirArrow(),
  },
  {
    code: "RM8",
    name: "Mandatory Direction Arrows",
    cite: "SARTSM Vol 1 §7.2.12",
    check: "YELLOW arrows (variants RM8.1–RM8.6) marked in a lane on the approach to a junction. The arrow in YOUR lane is the one that binds.",
    draw: () =>
      road() +
      centreLine() +
      arrowLeft(84, 208) +
      arrowStraight(178, 44, 208) +
      dirArrow(),
  },
  {
    code: "RM9",
    name: "Exclusive Use Lane Line",
    cite: "SARTSM Vol 1 §7.2.13, §7.2.21; NRTR 2000 reg 289",
    check: "Broken YELLOW line minimum 150 mm wide, used together with an exclusive-use word or symbol marking (RM17).",
    draw: () =>
      road() +
      vline(150, { mm: 150, fill: YELLOW, dash: "26 20" }) +
      `<text x="76" y="132" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="bold" fill="${YELLOW}" text-anchor="middle">BUS</text>` +
      dirArrow(),
  },
  {
    code: "RM10",
    name: "Box Junction",
    cite: "SARTSM Vol 1 §7.2.14",
    check: "Continuous YELLOW boundary lines enclosing yellow cross-hatched diagonals, all minimum 100 mm wide.",
    draw: () =>
      `<defs>${hatch("rm10a", { gap: 34, angle: 45 })}${hatch("rm10b", { gap: 34, angle: -45 })}` +
      `<clipPath id="rm10c"><rect x="34" y="34" width="172" height="172"/></clipPath></defs>` +
      road() +
      `<g clip-path="url(#rm10c)"><rect width="${S}" height="${S}" fill="url(#rm10a)"/>` +
      `<rect width="${S}" height="${S}" fill="url(#rm10b)"/></g>` +
      `<rect x="34" y="34" width="172" height="172" fill="none" stroke="${YELLOW}" stroke-width="${w(100)}"/>` +
      dirArrow(),
  },
  {
    code: "RM12",
    name: "No Stopping Line",
    cite: "SARTSM Vol 1 §7.2.16(2); paired sign R217 per §2.4.14.4; NRTR 2000 reg 304",
    check: "TWO forms. Continuous solid RED, minimum 150 mm wide, applies 24 hours. Broken RED, minimum 100 mm wide, applies only during the periods on the accompanying sign. Both forms shown — one on each kerb.",
    draw: () =>
      road() +
      vline(22, { mm: 150, fill: RED }) +
      vline(218, { mm: 100, fill: RED, dash: "26 20" }) +
      centreLine() +
      dirArrow(),
  },
  {
    code: "RM13",
    name: "No Parking Line",
    cite: "SARTSM Vol 1 §7.2.17(2); paired sign R216 per §2.4.13.4",
    check: "TWO forms. Continuous solid YELLOW, minimum 100 mm wide, applies 24 hours. Broken YELLOW, minimum 100 mm wide, applies only during the periods on the accompanying sign. Both forms shown — one on each kerb.",
    draw: () =>
      road() +
      vline(22, { mm: 100, fill: YELLOW }) +
      vline(218, { mm: 100, fill: YELLOW, dash: "26 20" }) +
      centreLine() +
      dirArrow(),
  },
  {
    code: "RM15",
    name: "Traffic Circle Mandatory Direction Arrows",
    cite: "SARTSM Vol 1 §7.2.19",
    check: "Marked in YELLOW, in SETS OF THREE equally spaced arrows, around a mini-circle. Drivers may proceed only in the direction indicated.",
    draw: () => {
      const cx = 120, cy = 116, r = 74;
      const arm = (deg) => {
        const a = (deg * Math.PI) / 180;
        const b = ((deg + 46) * Math.PI) / 180;
        const p = (t, rad) => `${(cx + rad * Math.cos(t)).toFixed(1)} ${(cy + rad * Math.sin(t)).toFixed(1)}`;
        const tipA = (deg + 62) * Math.PI / 180;
        return (
          `<path d="M${p(a, r)} A${r} ${r} 0 0 1 ${p(b, r)}" fill="none" stroke="${YELLOW}" stroke-width="11" stroke-linecap="butt"/>` +
          `<path d="M${p(tipA, r)} L${p(b, r - 13)} L${p(b, r + 13)} Z" fill="${YELLOW}"/>`
        );
      };
      return (
        road() +
        `<circle cx="${cx}" cy="${cy}" r="26" fill="${YELLOW}"/>` +
        [200, 320, 80].map(arm).join("") +
        dirArrow()
      );
    },
  },
  {
    code: "RTM1",
    name: "Stop line",
    cite: "SARTSM Vol 1 §7.2.1(4); NRTR 2000 reg 286(2)(c)(i), reg 307",
    check: "Continuous solid WHITE line, minimum 300 mm wide urban / 500 mm rural, across the full width of the approach. Deliberately NO 'STOP' legend — that is a separate word marking, and the chart vignette's legend was chart context.",
    draw: () =>
      road() + centreLine({ y1: 0, y2: 150 }) + hline(168, { mm: 300 }) + dirArrow(),
  },
  {
    code: "RTM2",
    name: "Yield line",
    cite: "SARTSM Vol 1 §7.2.2(4); NRTR 2000 reg 286(2)(c)(ii)",
    check: "BROKEN white line, minimum 300 mm wide urban / 500 mm rural, line-to-gap ratio 2:1 (600 mm line, 300 mm gap recommended).",
    draw: () =>
      road() + centreLine({ y1: 0, y2: 150 }) + hline(168, { mm: 300, dash: "26 13" }) + dirArrow(),
  },
  {
    code: "RTM3",
    name: "Pedestrian crossing lines",
    cite: "SARTSM Vol 1 §7.2.3(2); NRTR 2000 reg 315",
    check: "TWO continuous white lines, each minimum 100 mm wide, at least 2,4 m apart (3 m preferred), across the full width of the roadway.",
    draw: () => road() + hline(88, { mm: 100 }) + hline(176, { mm: 100 }) + dirArrow(),
  },
  {
    code: "RTM4",
    name: "Block pedestrian crossing",
    cite: "SARTSM Vol 1 §7.2.4(2); NRTR 2000 reg 286(2)(c)(iii), reg 315",
    check: "Rectangular white blocks, minimum 2,4 m long and 600 mm wide, spaced 600 mm apart, across the full width of the roadway. Blocks run WITH the direction of travel.",
    draw: () => {
      // Six blocks spanning the full roadway edge to edge, per "shall extend
      // across the full width" — the gap is solved for, not eyeballed, so the
      // first and last blocks sit flush with the kerbs.
      const n = 6, bw = 22, y = 66, h = 108;
      const gap = (S - n * bw) / (n - 1);
      let out = road();
      for (let i = 0; i < n; i++)
        out += `<rect x="${(i * (bw + gap)).toFixed(1)}" y="${y}" width="${bw}" height="${h}" fill="${WHITE}"/>`;
      return out + dirArrow();
    },
  },
];

// ── Emit ─────────────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

mkdirSync(OUT, { recursive: true });
for (const m of MARKINGS) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${esc(m.name)} road marking">` +
    `<title>${esc(m.code)} — ${esc(m.name)}</title>` +
    `<desc>Drawn to specification, not traced. Source: ${esc(m.cite)}. ${esc(m.check)}</desc>` +
    m.draw() +
    `</svg>\n`;
  writeFileSync(join(OUT, `${m.code}.svg`), svg);
}
// The review page is emitted from the same list, so it can never fall out of
// step with the artwork — and cannot be lost by regenerating the folder.
const cards = MARKINGS.map(
  (m) => `<div class="card"><div class="pair">
<figure><img src="/markings/${m.code}.svg" alt=""><figcaption>shipped</figcaption></figure>
<figure><img src="/markings-v2/${m.code}.svg" alt=""><figcaption>redraw</figcaption></figure></div>
<div class="name"><span class="code">${esc(m.code)}</span> · ${esc(m.name)}</div>
<div class="cite">${esc(m.cite)}</div><div class="check">${esc(m.check)}</div></div>`,
).join("\n");

writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<meta charset="utf-8">
<title>Road markings — redraw for review (K53-37)</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;background:#faf7f2;color:#221813;margin:0;padding:28px}
  h1{font-size:20px;margin:0 0 4px} p.sub{margin:0 0 24px;color:#6b5c52}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:18px}
  .card{background:#fff;border:1px solid #e7ded2;border-radius:12px;padding:14px}
  .pair{display:flex;gap:12px} .pair figure{margin:0;text-align:center;flex:1}
  .pair img{width:100%;max-width:140px;aspect-ratio:1;object-fit:contain;background:#f2efe9;border-radius:6px}
  .pair figcaption{font-size:11px;color:#8a7a6d;margin-top:4px}
  .code{font-family:ui-monospace,monospace;font-weight:700}
  .name{font-size:13px;margin:10px 0 2px} .cite{font-size:11px;color:#8a7a6d}
  .check{font-size:12px;color:#4a3b32;margin-top:6px;border-top:1px solid #f0e8dc;padding-top:6px}
  .thumbs{margin-top:26px;padding:14px;background:#fff;border:1px solid #e7ded2;border-radius:12px}
  .thumbs img{width:48px;height:48px;object-fit:contain;margin-right:6px}
</style>
<h1>Road markings — redraw for review</h1>
<p class="sub">Left = shipped (chart vignette). Right = redraw, drawn to the SARTSM specification. Nothing is wired up — see README.md. K53-37 · 2026-08-04</p>
<div class="grid">
${cards}
</div>
<div class="thumbs"><strong style="font-size:13px">At library thumbnail size (48&nbsp;px)</strong><br><div style="margin-top:8px">
${MARKINGS.map((m) => `<img src="/markings-v2/${m.code}.svg" title="${esc(m.code)}">`).join("")}
</div></div>
`,
);

console.log(`wrote ${MARKINGS.length} markings + index.html to ${OUT}`);
export { MARKINGS, S };
