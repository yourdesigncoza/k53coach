# Exam scripts

## `build-questions-migration.mjs`

Generates a Supabase seed migration from the K53 wiki's original question bank
(`~/zoot/projects/wiki-builds/k53/wiki/Questions/*.md`).

```bash
npm run exam:build-migration
supabase db push
supabase gen types typescript --linked > src/lib/database.types.ts
```

- **Input:** 110 reviewed question notes with line-regular YAML frontmatter
  (`question_id`, `section`, `topic`, `vehicle_codes`, `answer_options{A,B,C}`,
  `correct_answer`, `difficulty`, `exam_likelihood`, `source_basis`,
  `related_signs`).
- **Output:** `supabase/migrations/<ts>_exam_question_bank.sql` — one
  `insert … on conflict (id) do nothing` per question, imported as
  `review_status='approved'`, `in_exam=true`, `in_readiness=false`.
- **Mapping:** section→topic (`rules`/`signs`/`controls`); difficulty
  easy/medium/hard→1/2/3; options `[A,B,C]`, answer=index of `correct_answer`;
  `vehicle_codes` expanded (`all_codes`→`{A,B,C,EB}`); `topic`→`topic_tag`.
- **`explanation`** comes from the note's `## Explanation` **body**, not the
  frontmatter scalar. Whatever wrote the notes cut the frontmatter copy at
  exactly 200 characters, and 11 of the 110 shipped to learners ending mid-word.
  The frontmatter is only a fallback for a note with no body section.
- **`sign_code`** is set from `SIGN_CODE_OVERRIDES` (per question) then
  `SIGN_NAME_TO_CODE`, a conservative hand-verified map (checked against the
  approved+`sa_relevant` `road_signs` set and confirmed to have a
  `public/signs/<code>.svg`). Any related sign not in the map resolves to
  `null` — a question renders no artwork rather than a wrong glyph.
- **`WITHDRAWN`** emits a question as `review_status='draft'` with a reason,
  rather than dropping the row — deleting it from a generated file loses the
  record of why it went.

The generated migration is the reproducible, versioned artifact — commit it.
Re-running the script is idempotent (`on conflict do nothing`), so admin edits
made after the first push are preserved.

### Adding a `sign_code` mapping — read this first

The image renders **directly above the prompt** (`question-card.tsx`), so a
wrong code contradicts the question it illustrates. The 2026-07-30 citation
sweep found three map entries naming a real code for the *wrong glyph*, and
`RS-027` shipped displaying the gravel sign above a question whose distractor
**is** the gravel sign.

Two failure modes, both silent:

1. **The map entry is wrong.** A name that sounds right is not enough —
   "T-Junction Sign" was `W409`, the chevron *board*, not the triangle.
   Check `data/verify/verdicts/<code>.json` describes the glyph the wiki name
   means, and pin the `road_signs` name in a trailing comment.
2. **`related_signs` names a distractor.** It records what a question *relates
   to*; for "which sign is it — A, B or C?" that is often a wrong option. Use
   `SIGN_CODE_OVERRIDES` for those.

A name that cannot be resolved from the name alone (`"Speed Limit Sign"` —
`R201-<n>` is one sign per speed) must stay **unmapped**. Null is correct;
a plausible guess is not.

### Content corrections live in `scripts/data-repairs/`, not here

This generator fixes only what it can *derive* — glyph mapping and truncation.
Corrections to the prose itself (a fabricated L-plate rule, a wrong licence-code
threshold) belong in a dated repair file, so there is one source of truth per
correction. On a fresh database the order is: `supabase db push`, then
`node scripts/data-repairs/apply-repairs.mjs data-repairs-2026-07-30.json`.
