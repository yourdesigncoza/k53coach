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
- **`sign_code`** is set only from `SIGN_NAME_TO_CODE`, a conservative
  hand-verified map (checked against the approved+`sa_relevant` `road_signs`
  set and confirmed to have a `public/signs/<code>.svg`). Any related sign not
  in the map resolves to `null` — a question renders no artwork rather than a
  wrong glyph. To add a mapping, verify the code exists approved and has an SVG,
  then extend the map and regenerate.

The generated migration is the reproducible, versioned artifact — commit it.
Re-running the script is idempotent (`on conflict do nothing`), so admin edits
made after the first push are preserved.
