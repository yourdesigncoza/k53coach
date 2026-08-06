import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The signed "paper token" for the free readiness assessment.
 *
 * Why this exists: the free readiness test is anonymous and device-local by
 * design (constraint 3, under-18 learners), so there is no user to rate-limit and
 * no attempt row to key against — and it is the only place in the app where an
 * LLM call sits behind an unauthenticated endpoint.
 *
 * `/readiness` server-renders the sampled questions, so it can hand the client a
 * token naming exactly which question ids were served, signed and time-limited.
 * The assess route will only ground an assessment in ids inside a valid token.
 * Effects:
 *  - an assessment costs an attacker a real page load first;
 *  - the payload cannot be widened, forged, or pointed at the whole bank;
 *  - the token carries nothing about a person — question ids and a timestamp.
 *
 * It is not a session and must never become one. Do not add an identifier here.
 */

/** How long a served paper can still be assessed. */
export const PAPER_TOKEN_TTL_MS = 30 * 60 * 1000;

interface TokenBody {
  /** Question ids served in this sitting. */
  ids: string[];
  /** Issued-at, epoch ms. */
  iat: number;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * The signing secret, or null when it is unset. Null means the free assessment
 * degrades to its deterministic template — never that an unsigned token is
 * accepted.
 */
export function paperTokenSecret(): string | null {
  return process.env.READINESS_TOKEN_SECRET || null;
}

/** Sign the ids served in one sitting. `now` is injectable for tests. */
export function signPaperToken(
  ids: string[],
  secret: string,
  now: number = Date.now(),
): string {
  const payload = b64url(JSON.stringify({ ids, iat: now } satisfies TokenBody));
  return `${payload}.${hmac(payload, secret)}`;
}

/**
 * Verify a token and return the ids it covers, or null if it is malformed,
 * mis-signed or expired.
 *
 * Signature comparison is constant-time, matching how `payfast.ts` compares an
 * ITN signature — a timing oracle on a signature check is a signature check that
 * can be walked.
 */
export function verifyPaperToken(
  token: unknown,
  secret: string,
  now: number = Date.now(),
): { ids: string[]; iat: number } | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = hmac(payload, secret);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let body: TokenBody;
  try {
    body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!Array.isArray(body.ids) || !body.ids.every((i) => typeof i === "string"))
    return null;
  if (typeof body.iat !== "number") return null;
  if (now - body.iat > PAPER_TOKEN_TTL_MS || body.iat > now + 60_000) return null;

  return { ids: body.ids, iat: body.iat };
}

/**
 * The value stored to make a token single-use. A hash, not the token: the row
 * needs to answer "have I seen this one" and nothing more, and a table of live
 * tokens is a table worth stealing.
 */
export function paperTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
