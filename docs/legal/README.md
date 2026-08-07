# Legal documents

The Terms and Conditions and the Privacy Policy published on k53coach.co.za. Both were **supplied
by the business** — Louwrens Luyt, on Linear **K53-53 "Terms & Conditions"**, 2026-08-07 — as PDFs
attached to the issue description.

## The verbatim rule

**The supplied clauses are published exactly as supplied. We do not edit them.**

No rewording, no condensing, no quietly dropping a clause that describes something the app does not
do. When a document says something we would have written differently, it still ships as written and
the observation goes back to Louwrens — the copy is his to change, not ours. He is the Information
Officer and the documents carry his company's name. `verbatim.test.ts` compares the rendered word
stream against the extracted PDF text, so drift fails a test rather than reaching production.

The one thing we *do* own is making the app honour what they promise. The 7-day money-back
guarantee (Terms §8–§9) is the live example: publishing it obliged us to say so on the payment
screen, which is new app copy, not an edit to his document.

### Amendments — added 2026-08-07 (John)

**The rule was blocking shipping, so it was amended rather than obeyed into a corner.** The site is
in beta and we build and ship what the client asked for; a feature does not wait for a revised PDF
to arrive. The original wording ("no additions") would have meant either holding Ask Coach or
publishing a policy that did not describe it — and of those two, the second is worse than writing a
clause and labelling it.

So a document may carry an `amendments` list beside `sections`:

- **`sections`** — the clauses as supplied. Fully covered by the verbatim guard. Untouchable.
- **`amendments`** — clauses **we** wrote, for features that shipped after the document was
  supplied. Published under their own numbers after the supplied clauses, and excluded from the
  word-for-word comparison because they are not in the PDF.

Every amendment must declare `addedOn`, `addedBy` and a `reason` saying what changed in the
product. That is enforced by test, the same discipline `assessment-glossary.ts` uses to stop
invented Afrikaans accumulating unlabelled. Two more tests close the obvious holes: a supplied
clause may never be *relabelled* as an amendment (which would exempt it from the guard), and an
amendment must take the next clause number so nothing renumbers a supplied one.

What has NOT changed: supplied text still cannot be touched, and an undeclared addition still fails.
The guard's job was always to stop text drifting silently — not to stop the product moving.

**The audit is deferred, not skipped.** When the business asks, we run a pass over every amendment
against the then-current supplied documents and fold what they accept into a revised PDF. Current
amendments awaiting that pass:

| Doc | Clause | Added | Why |
|---|---|---|---|
| Privacy | 31 — AI Coach and Chat (Ask Coach) | 2026-08-07 | First feature accepting free text from a User and sending it to a third-party AI provider; clauses 4, 12 and 24 did not describe it |

## What is here

| File | What it is |
|---|---|
| `terms-2026-08.txt` | `pdftotext -layout` of the Terms PDF — 33 clauses |
| `privacy-2026-08.txt` | `pdftotext -layout` of the Privacy PDF — 30 clauses |
| `../../public/legal/k53-coach-terms-2026-08.pdf` | the original, served at `/legal/k53-coach-terms-2026-08.pdf` |
| `../../public/legal/k53-coach-privacy-2026-08.pdf` | the original, served at `/legal/k53-coach-privacy-2026-08.pdf` |

The `.txt` files are the reference the site content is checked against. They are committed so that
the next revision Louwrens sends is a reviewable diff rather than a fresh 13-page read.

## Where the site copy lives

`src/content/legal/{terms,privacy}.ts` — typed content modules, rendered by
`src/components/legal/legal-document.tsx` at `/legal/terms`, `/legal/privacy` and `/legal/refund`
(the last is a filtered subset of the *same* Terms data, so there is no second copy of the refund
clauses to drift).

⚠️ **Deliberately not in `messages/*.json`.** The i18n message files are overridden at request time
by admin-edited `ui_translations` rows (`src/i18n/request.ts` → `src/lib/translations.ts`), with no
staleness detection. Legal text routed through that path could be silently rewritten from the admin
translation manager without a commit — which is precisely what the verbatim rule exists to prevent.

## Updating them

1. Save the new PDF over the one in `public/legal/` (rename with the new month).
2. Re-run `pdftotext -layout <pdf> docs/legal/<name>.txt` and commit the new text.
3. Diff the text against the previous version, apply the same changes to the content module, and
   update `effectiveDate`.
4. Re-check every clause is present and numbered continuously before deploying.

## Language

English only, on both `/en` and `/af` — settled with John on 2026-08-07. Page chrome stays
localised; the document body does not. If an Afrikaans version is ever supplied, the `LegalDoc`
type is locale-agnostic and a sibling module is all it needs.

## Still missing

Of the eight documents `docs/product/PRD.md` lists under DB12, these two are now done. Outstanding:
POPIA Policy, Parent Consent Policy, School Agreement, Cookie Policy, AI Usage Disclaimer — plus a
PAIA §51 manual, which private bodies are required to have and which nobody has drafted.
