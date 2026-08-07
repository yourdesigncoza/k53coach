/**
 * Domain terminology handed to the model when it writes in a non-English locale.
 *
 * ## Why this exists
 *
 * The model is given the learner's result and English verified explanations, and
 * asked to write in Afrikaans. Nothing tells it which Afrikaans word this app
 * uses for a section, so it picks one per generation. It has already picked the
 * wrong one: it returned **"Voertuigbeheer"** where the app says
 * **"Voertuigkontroles"**, putting two words for one section on the same page —
 * see `pointTitle` in `assessment-core.ts`, which patches the *headings* by
 * substituting our label. Nothing patches the prose, and the prose is most of
 * what the learner reads.
 *
 * These are not our preferences. `topics.*`, `nav.mock` and `module.*` are
 * Louwrens's rulings from the 41-decision wording review (2026-08-06, K53-48):
 * "Voertuigkontroles" over our "Voertuigbeheer", "Proefeksamen" over his earlier
 * "Oefen toets". Handing them to the model makes the coach speak the same
 * Afrikaans as the buttons around it.
 *
 * ## Why the values are literals rather than read from messages/af.json
 *
 * `assessment-core.ts` is imported by `assessment-panel.tsx`, a client
 * component. Importing the messages JSON here would pull the whole file into the
 * client bundle. Instead the values are written out — which also makes this a
 * list a reviewer can read in one screen — and
 * `assessment-glossary.test.ts` asserts every `source`-bearing term still equals
 * its `messages/af.json` value. Drift fails the test rather than reaching a
 * learner.
 */

export type GlossaryTerm = {
  /** The English concept, as the model will have it in mind. */
  en: string;
  /** The term to use. */
  use: string;
  /** A wrong term seen in real output, or a plausible calque, to rule out. */
  avoid?: string;
  /**
   * `namespace.key` in `messages/af.json` this value must match, when the app
   * already ships the term. Absent means the term is not a UI string — those
   * carry `pending` instead.
   */
  source?: string;
  /**
   * Set when the term has NOT been ruled on by a native speaker. Everything
   * without this came from Louwrens's reviewed wording; everything with it is
   * our best guess and belongs in the next review batch.
   */
  pending?: true;
};

export const GLOSSARIES: Record<string, GlossaryTerm[]> = {
  af: [
    { en: "Road Signs", use: "Padtekens", source: "topics.signs" },
    { en: "Rules of the Road", use: "Reëls van die Pad", source: "topics.rules" },
    {
      en: "Vehicle Controls",
      use: "Voertuigkontroles",
      avoid: "Voertuigbeheer",
      source: "topics.controls",
    },
    { en: "mock exam", use: "Proefeksamen", source: "nav.mock" },
    { en: "test hint", use: "Toetswenk", source: "module.testHint" },
    {
      en: "practice (a topic)",
      use: "Oefen",
      source: "module.practice",
      // module.practice is "Oefen hierdie onderwerp"; the verb is what the model
      // needs, so the assertion is a prefix match. See the test.
    },
    {
      // The defect that prompted this file's first use: READINESS_FORMAT_RULES
      // says "a SHORT sample of a few questions", and the model rendered
      // "sample" as "monster" — correct for a statistical sample, and to a
      // 17-year-old reading quickly, also the word for a monster.
      en: "sample (a short set of questions, not a full paper)",
      use: "kort toets",
      avoid: "monster",
      pending: true,
    },
  ],
};

/**
 * The prompt block for a locale, or `""` when there is nothing to say (English,
 * or any locale with no glossary). Callers can append unconditionally.
 */
export function glossaryBlock(locale: string): string {
  const terms = GLOSSARIES[locale];
  if (!terms?.length) return "";

  const lines = terms.map((t) => {
    const avoid = t.avoid ? ` — never "${t.avoid}"` : "";
    return `  - ${t.en} → "${t.use}"${avoid}`;
  });

  return `
- TERMINOLOGY: this app already uses specific words for its own sections and features. Use exactly these, so your text matches the buttons and headings around it. Where a term appears mid-sentence, adjust capitalisation naturally.
${lines.join("\n")}`;
}
