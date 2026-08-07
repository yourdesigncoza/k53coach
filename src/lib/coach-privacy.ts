/**
 * Redaction for Ask Coach messages.
 *
 * A free-text box is the first place in this app a learner can type ANYTHING,
 * and what they type goes to a third-party model provider and then sits in a
 * table an admin reads. POPIA is settled and is not a launch gate (CLAUDE.md
 * constraint 1, closed by John 2026-07-24) — but the design principle it leaves
 * behind does apply here: collect minimal personal data, and do not invent new
 * collection without asking. Constraint 3 also expects under-18 learners.
 *
 * So obvious identifiers are stripped BEFORE the message is sent anywhere and
 * before it is stored. The stored body is the redacted one: the review queue
 * needs to know what was asked, not who asked it, and it already has `user_id`
 * if anyone genuinely needs the person.
 *
 * This is a courtesy filter, not a guarantee. It catches the identifiers people
 * actually paste — an ID number, a phone number, an email — and cannot catch a
 * name. Claiming more than that would be the kind of overclaim this feature has
 * already had knocked out of it once.
 */

export const REDACTIONS = [
  {
    label: "[ID number]",
    /**
     * A South African ID number is 13 digits (YYMMDDSSSSCAZ), often typed with
     * spaces after the date or the sequence. Anchored on word boundaries so a
     * long figure inside a sentence is caught but "120" is not.
     */
    pattern: /\b\d{6}\s?\d{4}\s?\d{3}\b/g,
  },
  {
    label: "[email]",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    label: "[phone]",
    /** +27 or 0-leading, with the spacing South Africans actually type. */
    pattern: /(?:\+27|\b0)\s?\d{2}\s?\d{3}\s?\d{4}\b/g,
  },
] as const;

export interface Redaction {
  text: string;
  /** Which kinds were removed — recorded so the queue can show that it happened. */
  removed: string[];
}

/**
 * Strip obvious identifiers.
 *
 * Order matters: the ID pattern runs first because a 13-digit run would
 * otherwise be partly consumed by the phone pattern, leaving three loose digits
 * and the appearance of a redaction that did not happen.
 */
export function redactPii(text: string): Redaction {
  let out = text;
  const removed: string[] = [];
  for (const { label, pattern } of REDACTIONS) {
    const before = out;
    out = out.replace(pattern, label);
    if (out !== before) removed.push(label);
  }
  return { text: out, removed };
}

/**
 * How long a `refused` / `not_covered` body is kept.
 *
 * The review queue's value is the QUESTION and how often it recurs, and both
 * survive aggregation. Keeping the raw text forever would be a permanent
 * transcript of everything learners typed, which is not what the queue is for.
 */
export const UNANSWERED_RETENTION_DAYS = 30;
