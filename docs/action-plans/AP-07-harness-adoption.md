# AP-07 — Adopt the e2e assessment driver + record the rtk trap

**Priority P3.** Low risk, low effort. The harness that found all ten findings is
currently untracked.

## Problem

`scripts/e2e/assessment.mjs` exists but is not in git, not documented, and not
mentioned anywhere a future session would look. Everything in
`docs/ai-assessment-test-run-2026-08-05.md` was produced by it, and re-verifying
AP-03/04/05 depends on it. If it disappears, the verification steps in those plans
become "sit 64 questions by hand, five times".

Three traps it already encodes are worth keeping deliberately, because each cost
real time to find.

## Approach

1. **Track the driver** alongside `scripts/e2e/flow.mjs`. It already follows that
   file's conventions:
   - Playwright resolved by explicit path (ESM ignores `NODE_PATH`), reusing the
     cached chromium via `findChromium()` rather than downloading a matched build
   - the same `signedInContext()` session-minting approach (the app's auth screen is
     magic-link only, so there is no password form to drive)
   - findings/logs to stdout, screenshots + text captures to an `--out` directory
2. **Document it** in `scripts/e2e/README.md`: the profiles
   (`weak` / `strong` / `mixed` / `cache`), `--locale`, `--hold`, `--attempt`, and the
   fact that it reads the assembled paper out of `localStorage`
   (`k53.exam.draft`) to plan a target score. That last point deserves a sentence of
   its own — it works because scoring is client-side, so the paper on the client
   necessarily carries the answer index, and option order is already shuffled at
   assembly so the draft's index matches the on-screen A/B/C order.
3. **Optional npm script** — `"e2e:assessment": "node scripts/e2e/assessment.mjs"`.
   Do **not** add Playwright to `package.json`; the repo's stated reason for keeping
   it out of tree (~300 MB for a QA-only tool) still holds.
4. **Record the traps** — the rtk note is already added to the test-run doc and to
   the `project-gotchas` memory. Cross-reference from `scripts/e2e/README.md` so
   someone debugging a grep finds it there too.

## The traps worth keeping

- **ESM ignores `NODE_PATH`.** `NODE_PATH=… node script.mjs` fails with
  `ERR_MODULE_NOT_FOUND`; resolve the install path explicitly.
- **The result page has two `<main>` elements** (app shell + page content), so a bare
  `locator("main")` is a strict-mode violation. Use `.last()`. This one aborted a run
  *after* a successful generation, which reads like a feature failure but wasn't.
- **`pkill -f "assessment.mjs"` kills the invoking shell**, because the Bash tool's
  own command line contains the pattern. Anchor on the interpreter:
  `pkill -f "^node .*assessment\.mjs"`.
- **rtk filters shell output.** See the ⚠ section in
  `docs/ai-assessment-test-run-2026-08-05.md` — the single most expensive trap of the
  session.
- **Match the CTA on the shared stem** (`/assessment|assessering/i`), not the
  `AI`/`KI` abbreviation — that string is itself finding 9.

## Files

- `scripts/e2e/assessment.mjs` (track as-is)
- `scripts/e2e/README.md` (extend)
- `package.json` (optional script entry)

## Risks

- **Do not commit the captures.** `<out>/*.txt` and `*.png` contain real answer data
  and screenshots from the test account, and the fixture attempts are real rows in the
  prototype database. Keep the default `--out` inside the scratchpad, and if a default
  inside the repo is ever added, gitignore it.
- The driver hardcodes the e2e buyer's credentials via `E2E_EMAIL` /
  `E2E_PASSWORD` defaults, same as `flow.mjs`. That is existing practice for the
  prototype project; don't extend it to anything with real user data.
- It writes to the **prototype** Supabase. Five `exam_attempts` rows already exist
  from this session; a future session should know those are fixtures, not learners.

## Verification

- `node scripts/e2e/assessment.mjs --profile cache --attempt <id>` runs from a clean
  checkout with only the documented out-of-tree Playwright install
- `npm run lint` clean on the new file
- `git status` shows no capture artifacts staged

## Done when

- [ ] Driver tracked, `scripts/e2e/README.md` documents every flag and the
      localStorage mechanism
- [ ] The five traps recorded where the next session will hit them
- [ ] No captures or fixtures committed
