/**
 * Opening suggestions for an empty conversation.
 *
 * Every one of these is asserted answerable in
 * `src/lib/__fixtures__/coach-adversarial.json` — a suggestion chip that leads
 * to "I can't answer that" is worse than no chip at all, because the app itself
 * proposed the question. If you add one here, add it to the fixture's
 * `in_scope_direct` class first and let the suite prove it retrieves.
 */
const SUGGESTIONS: Record<string, string[]> = {
  en: [
    "What does a stop sign mean?",
    "How far should I follow behind the car in front?",
    "When may I overtake on a solid line?",
    "Who goes first at a four way stop?",
  ],
  af: [
    "Wat beteken 'n stopteken?",
    "Hoe ver moet ek agter die kar voor my bly?",
    "Mag ek op 'n soliede lyn verbysteek?",
    "Wie het voorrang by 'n vierrigtingstop?",
  ],
};

export function suggestionsFor(locale: string): string[] {
  return SUGGESTIONS[locale] ?? SUGGESTIONS.en;
}
