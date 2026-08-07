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

/** Which assessment the prompt is for. Some terms belong to only one. */
export type Surface = "exam" | "readiness";

export type GlossaryTerm = {
  /** The English concept, as the model will have it in mind. */
  en: string;
  /** The term to use. */
  use: string;
  /**
   * Limit this term to one surface. Set for anything a learner on the other
   * surface cannot reach — handing the model a word for a paywalled feature is
   * how it ends up recommending one.
   */
  only?: Surface;
  /** Wrong terms seen in real output, or plausible calques, to rule out. */
  avoid?: string[];
  /**
   * `namespace.key` in `messages/af.json` this value must match, when the app
   * already ships the term.
   */
  source?: string;
  /**
   * A native speaker's ruling on a term the app does NOT ship as a UI string —
   * who said it and when. The alternative provenance to `source`.
   */
  ruled?: string;
  /**
   * Set when the term carries NEITHER an af.json source NOR a native ruling —
   * our own guess, and it belongs in the next review batch. Every term must have
   * one of the three; the test enforces it, so invented Afrikaans cannot
   * accumulate here unlabelled.
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
      avoid: ["Voertuigbeheer"],
      source: "topics.controls",
    },
    {
      // EXAM ONLY. On the free readiness read this term caused the exact defect
      // `readinessAllowedHrefs` exists to prevent: given the word, the model
      // wrote "die volle Proefeksamen-gereedheid" and planned "'n
      // Proefeksamen-styl oefensessie" for a learner who has not paid and
      // cannot open /mock. Dropping the href is not enough if the prose still
      // sells it.
      en: "mock exam",
      use: "Proefeksamen",
      source: "nav.mock",
      only: "exam",
    },
    { en: "test hint", use: "Toetswenk", source: "module.testHint" },
    // NOT "practice → Oefen". Listing it produced "Doen nog Oefen vir
    // Padtekens" and "Hou aan met Oefen oor Padtekens" — the model read a
    // glossary entry as a fixed label and stopped inflecting the verb. Only pin
    // NOUNS the app puts on screen as names. The model's own Afrikaans for
    // ordinary verbs was never the problem.
    {
      // The defect that prompted this file's first use: READINESS_FORMAT_RULES
      // says "a SHORT sample of a few questions", and the model rendered
      // "sample" as "monster" — correct for a statistical sample, and to a
      // 17-year-old reading quickly, also the word for a monster.
      en: "sample (a short set of questions, not a full paper)",
      use: "kort toets",
      avoid: ["monster"],
      pending: true,
    },
    {
      // The model wrote "volstruislyn" — volstruis is an ostrich — and
      // "geen-oornamelyn", calquing "overtake" through oorneem (take over)
      // rather than inhaal, in the same reply where it used inhaal correctly.
      // Invented road-marking Afrikaans, served to a learner as fact: the
      // foreign/invented-terminology failure mode (memory:
      // foreign-signage-failure-mode), in a vocabulary we had never pinned.
      en: "solid line you may not cross to overtake",
      use: "soliede lyn wat verbysteek verbied",
      avoid: ["volstruislyn", "geen-oornamelyn"],
      ruled: "Louwrens, 2026-08-07",
    },
  ],
};

/**
 * The prompt block for a locale, or `""` when there is nothing to say (English,
 * or any locale with no glossary). Callers can append unconditionally.
 */
export function glossaryBlock(locale: string, surface: Surface): string {
  const terms = GLOSSARIES[locale]?.filter((t) => !t.only || t.only === surface);
  if (!terms?.length) return "";

  const lines = terms.map((t) => {
    const avoid = t.avoid?.length
      ? ` — never ${t.avoid.map((a) => `"${a}"`).join(" or ")}`
      : "";
    return `  - ${t.en} → "${t.use}"${avoid}`;
  });

  return `
- TERMINOLOGY: this app already uses specific words for its own sections and features. Use exactly these, so your text matches the buttons and headings around it. Where a term appears mid-sentence, adjust capitalisation naturally.
${lines.join("\n")}`;
}
