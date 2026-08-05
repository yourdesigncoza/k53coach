# AP-04 — Never persist a fallback assessment; add a regenerate path

**Priority P1.** A transient failure at the wrong moment permanently costs a paying
learner the feature they paid for.

## Problem

`src/app/api/exam/assess/route.ts` writes the assessment back to the attempt
**regardless of whether it is the real thing or the deterministic template**:

```ts
if (!assessment) assessment = buildFallbackAssessment(payload);
assessment.model = assessment.fallback ? "fallback" : LLM_MODEL;
…
await supabase.from("exam_attempts").update({ assessment: … }).eq("id", attempt.id);
```

and the top of the same route returns early forever after:

```ts
if (attempt.assessment) return NextResponse.json({ assessment: attempt.assessment, cached: true });
```

The fallback is produced whenever `hasLlmKey()` is false **or the call throws** —
so a missing key, a rate-limit, a timeout, or any provider blip at the moment the
learner taps *View AI Assessment* means they get the template and **can never get
the real one**. There is no retry and no regenerate control in the UI.

Confirmed in run 5b: the only way to regenerate was to `PATCH assessment = null`
by hand through PostgREST.

## Evidence

Run 5b (dev server started with `OPENAI_API_KEY=` empty), attempt `90e7a803`:

```
status 200  1761ms
model: fallback  cached: false  fallback: true
```

The rendered output is honest and useful — it leads with the weakest section and
invents nothing — but it is thin by design:

> **Coach Says** You're not there yet, but now you know exactly where. 3 sections need work.
> **What you have got** *You showed up* — Taking a full mock is the single best way to find your gaps early.
> **Where the marks are going** Road Signs — You got 9/28 — you need 22 to pass this section. Review the module, then practise. *(and the same shape twice more)*
> **Your plan** Learn → Road Signs · Practice → Road Signs until you're consistently over the pass line · Retake the mock exam

That is the right thing to show during an outage. It is the wrong thing to show
forever.

## Approach

1. **Don't write a fallback.** Skip the `update` when
   `assessment.fallback === true`. The learner still gets the template in the
   response; nothing is persisted.
2. **Treat a stored fallback as a cache miss.** Belt and braces for anything already
   persisted (0 such rows exist today, so this is a guard, not a repair) and for any
   future path that writes one. Folds naturally into the
   [AP-03](AP-03-bilingual-assessment.md) cache-hit predicate:

   ```
   hit = entry exists for this locale
         AND entry.promptVersion === PROMPT_VERSION
         AND entry.assessment.fallback !== true
   ```
3. **Add a regenerate control.** When the rendered assessment is a fallback, the
   `fallbackNote` should sit beside a **Try again** button rather than being a dead
   end. Reuse the existing `generate()` path in
   `src/components/exam/exam-assessment.tsx` — it already handles loading and error
   toasts.
4. **Rate-limit it.** A regenerate button is a paid LLM call on demand. Cap per
   attempt (e.g. a small number of generations) and guard against double-submit;
   the button is already disabled while `loading`, which covers the accidental case
   but not a determined one.

## Files

- `src/app/api/exam/assess/route.ts` — conditional write, fallback-aware cache hit,
  per-attempt generation cap
- `src/components/exam/exam-assessment.tsx` — Try-again affordance when
  `assessment.fallback`
- `messages/{en,af}.json` — a `assessment.retry` string
- `src/lib/exam-assessment.ts` — if the cap is tracked in the envelope, it lives here

## Risks

- **Cost.** Making regeneration possible makes repeat generation possible. The cap is
  the control; pick the number deliberately rather than leaving it unbounded.
- **A learner regenerating a *good* assessment** and getting a worse one. Only offer
  Try-again on fallbacks, not on successful generations — otherwise it becomes a
  reroll button and an invitation to spend.
- Interacts with AP-03's cache envelope; land AP-03 first or do them together.

## Verification

```bash
# fallback path — dev server with no key
kill <dev-pid>; OPENAI_API_KEY= npm run dev
node scripts/e2e/assessment.mjs --profile weak --locale en --hold
```

- Response is the template, `fallback: true` — and `exam_attempts.assessment` for
  that attempt is **still null / has no entry**
- Restore the key, reopen the same attempt → the **real** assessment generates
  without any manual DB step (this is the exact behaviour that was broken)
- A successful assessment shows **no** Try-again control
- Hitting the cap returns a clean error, not a 500

## Done when

- [ ] A fallback is never persisted
- [ ] A previously-stored fallback self-heals on next view
- [ ] Try-again appears only on fallbacks and is rate-limited
- [ ] Restoring the key recovers the paid feature with no manual intervention
- [ ] `npm test` / lint / typecheck pass
