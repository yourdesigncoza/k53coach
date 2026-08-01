# resources/ — the official source documents

Every primary document the K53 content rests on. This folder is the **source-of-truth
library**: when a sign, rule, marking or question needs a citation, it is read out of a
file here, quoted verbatim, and recorded. Nothing in the learner-facing content should
rest on recall or on a summary of a document — our worst content errors have always been
retrieval failures, not reasoning ones.

Product specs are **not** here — they live in `docs/product/`.

## What is tracked and what is not

Only `charts/`, `reference/` and the READMEs are in git. The bulk PDFs are ~550 MB and
stay local-only, which is why `.gitignore` excludes `legislation/`, `sartsm/`, `assets/`
and the contents of `restricted/`. **That is deliberate — don't relax it.** Every ignored
document below carries a re-fetch note so a fresh clone can rebuild the library.

## The library

### `legislation/` — the law itself (local-only)

The binding text. Where a rule, a penalty or a definition is asserted, it comes from here.

| File | What it is |
|---|---|
| `national-road-traffic-act-93-of-1996.pdf` | NRTA 93 of 1996 — Government Gazette **17603**, 22 Nov 1996 |
| `national-road-traffic-regulations-2000.pdf` | NRTR 2000 — Government Gazette **20963**, 17 Mar 2000. The *original* text (84 MB) |
| `nrtr-2000-consolidated-part1-kzntransport.pdf` | NRTR Part 1 consolidated to GNR.209 of 9 Mar 2012 (KZN Transport). Use this to check whether the 2000 original is still in force |
| `nrtr-amendment-2014-gg38142-gnr846.pdf` | NRTR amendment — GG 38142, GNR.846 (2014) |
| `nrtr-amendment-2014-correction-gg38185-gn975.pdf` | Correction to the above — GG 38185, GN 975 (2014) |
| `nrtr-learner-licence-24-months-2010-gg32959-gn134.pdf` | Learner's-licence 24-month validity — GG 32959, GN 134 (2010) |

> ⚠️ **The 2000 original is not the law in force.** Several regulations were substituted
> after 2000 (e.g. reg 297(2) by GNR.2116 r.52 w.e.f. 5 Oct 2001, reg 101(1)). Check the
> consolidated copy before quoting the original — this trap has produced wrong verdicts
> twice. See `scripts/data-repairs/question-fixes-drafts-2026-07-31.json`.

### `sartsm/` — SADC Road Traffic Signs Manual, 24 volume-chapters (local-only)

The engineering manual behind the signs and markings: what each sign *means*, where it is
used, and how it is applied. Named `V<volume>C<chapter>.pdf`. The ones already load-bearing:

| File | Chapter |
|---|---|
| `V1C7.pdf` | Vol 1 Ch 7 — **Road Markings** (May 2012). The source for all 16 written markings |
| `V2C7.pdf` | Vol 2 Ch 7 — railway crossings. The source for `RR28` |
| `V4C9.pdf` | Vol 4 Ch 9 — information signs |

Re-fetch any volume from `transport.gov.za/wp-content/uploads/2023/02/<name>.pdf`.

### `charts/` — the official sign chart (tracked)

`RTSigns_charts.pdf` — "ROAD TRAFFIC SIGNS", National Department of Transport, 2000.
Five A1 sheets. **This is the ground truth for road signs**: code, name, category, variant
and artwork. Sheet 2 of 5 carries the road markings as vector, which is where the marking
SVGs in `public/markings/` were extracted from.

Read by `scripts/signs/extract-pdf.mjs`, `extract-chart-authority.mjs`,
`ingest-wikipedia.mjs` and `markings/extract-official-svg.mjs`. A second copy is served to
browsers at `public/RTSigns_charts.pdf` — the admin sign-review page links it. Keep both.

> Sheet 2's marking labels are **vector, not text**, so `pdftotext` does not expose them.
> Absence of extracted text is not absence from the chart.

### `restricted/` — NOT a permitted content source (local-only)

Circulated "memo" scans of live licence-test terminals. See `restricted/README.md` before
opening anything in there.

### `reference/` — background reading (tracked)

Secondary material. Context and motivation only — never a citation for learner content.

| File | What it is |
|---|---|
| `western-cape-pass-rate-2025.md` | The 17% WC pass rate after the May 2025 computerised system. Cited in `docs/build-plan-2026-07.md` as the market case |

### `assets/` — source artwork (local-only)

Originals of images that ship in `public/`. `cockpit-controls-source.jpeg` is the numbered
cockpit diagram; the served copy is `public/img/cockpit-controls.jpg`.

## Rules for using this library

1. **Quote, don't paraphrase from memory.** A citation must name the file, the section or
   regulation number, and carry the words that were actually read.
2. **Check whether the text is still in force** before quoting `legislation/`.
3. **Never pass a document from `restricted/` to `llmChat` or any drafting prompt.**
4. **AI drafts; it never self-certifies.** A verification pass by the same model against the
   same prompt is circular. See `CLAUDE.md` constraint 9.
