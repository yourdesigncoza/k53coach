/**
 * Loads the Ask Coach corpus from the database and keeps a warm index.
 *
 * Split from `coach-corpus.ts` so that module stays pure and unit-testable; this
 * half is server-only and never imported by a test.
 *
 * ⚠ **The cache is per process, and there is more than one process.** On Vercel
 * this runs across many instances, so an admin edit reaches them as they roll
 * over rather than at once. That is why the TTL is short and why every stored
 * answer records `corpus_revision` — after the fact you can tell which build an
 * answer was grounded in, instead of guessing. A cross-instance invalidation
 * would need shared state this feature does not otherwise need.
 *
 * The other half of the correctness story: an empty or partial build is NEVER
 * cached. A cold start that half-failed would otherwise pin a corpus that
 * refuses every question for the whole TTL, and the symptom — "the coach says it
 * doesn't cover anything" — looks like a content problem, not an infrastructure
 * one.
 */
import { createClient } from "@/lib/supabase/server";
import { buildCorpus, type Corpus, type QuestionSource, type SignSource } from "@/lib/coach-corpus";
import { buildIndex, type Index } from "@/lib/coach-retrieval";

const TTL_MS = 5 * 60 * 1000;

interface Warm {
  corpus: Corpus;
  index: Index;
}

let warm: Warm | null = null;
let inflight: Promise<Warm | null> | null = null;

/** Below this the build is treated as failed rather than cached. */
const MIN_PASSAGES = 100;

async function load(): Promise<Warm | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const [signs, questions] = await Promise.all([
    supabase
      .from("road_signs")
      .select("code,name,category,content")
      .match({ asset_status: "approved", review_status: "approved", sa_relevant: true })
      .order("code"),
    supabase
      .from("questions")
      .select("id,topic,prompt,options,answer,explanation,objective_code")
      .eq("review_status", "approved"),
  ]);

  if (signs.error || questions.error) return null;

  const corpus = buildCorpus(
    (signs.data ?? []) as unknown as SignSource[],
    (questions.data ?? []) as unknown as QuestionSource[],
  );

  // Rules and controls alone are 52 passages, so anything near that means the
  // database half came back empty — which is a failure, not a small corpus.
  if (corpus.passages.length < MIN_PASSAGES) return null;

  return { corpus, index: buildIndex(corpus.passages) };
}

/**
 * The warm corpus, rebuilt at most once per TTL.
 *
 * Concurrent callers during a rebuild share one in-flight promise: without that,
 * a cold instance taking several simultaneous requests would run several full
 * corpus loads at once.
 */
export async function getCoachCorpus(): Promise<Warm | null> {
  if (warm && Date.now() - warm.corpus.builtAt < TTL_MS) return warm;
  if (inflight) return inflight;

  inflight = load()
    .then((next) => {
      // Only a good build replaces a good build. A transient database error
      // must not knock the coach offline while a usable corpus is in hand.
      if (next) warm = next;
      return next ?? warm;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
