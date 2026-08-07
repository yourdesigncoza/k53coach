/**
 * Report `ui_translations` overrides whose shipped default has drifted.
 *
 *   npm run i18n:check
 *
 * ## Why this exists
 *
 * An admin override outranks `messages/<locale>.json` permanently and by design
 * (John, 2026-08-07). Nothing drops it, nothing warns at request time, and the
 * merge in `src/i18n/request.ts` cannot tell a considered wording choice from a
 * row left behind by a code change. That is how commit `e05dd48` edited the
 * Afrikaans default and reached nobody, and how the claims audit's fixes sat
 * behind July overrides on `/af` for three weeks while `/en` was correct.
 *
 * Since the override is not allowed to lose, the drift has to be *loud* instead.
 * This is that loudness, moved out of the request path and into the dev loop.
 *
 * ## Exit codes
 *
 *   0  no drift, or drift only in wording namespaces (printed as a warning)
 *   1  drift in a claims-bearing namespace — see CLAIM_NAMESPACES
 *   0  no credentials (prints a skip line; it is not a failure to lack keys)
 *
 * A wording drift should not block a deploy; a price, a duration, a capability
 * or a legal promise should. That split is the whole point of the exit code —
 * a check that fails on everything gets bypassed, and then it checks nothing.
 *
 * ## What it cannot see
 *
 * It reads the base table with the service-role key, so it needs `.env.local`
 * and cannot run in a public CI without that secret. It is a pre-deploy command,
 * not a pull-request gate. `default_hash` is deliberately absent from
 * `ui_translations_public`, so there is no anon-readable path to this answer.
 */
import { createRequire } from "node:module";
import {
  hashSeed,
  isOverrideStale,
  isClaimNamespace,
  CLAIM_NAMESPACES,
} from "../../src/lib/translation-hash.ts";

const require = createRequire(import.meta.url);
const MESSAGES: Record<string, Record<string, Record<string, string>>> = {
  en: require("../../messages/en.json"),
  af: require("../../messages/af.json"),
};

type Row = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  default_hash: string | null;
};

const def = (locale: string, ns: string, key: string): string | undefined =>
  MESSAGES[locale]?.[ns]?.[key];

const truncate = (s: string, n = 60) =>
  s.length <= n ? s : `${s.slice(0, n - 1)}…`;

async function main() {
  let select: (path: string) => Promise<Row[]>;
  try {
    ({ select } = await import("../data-repairs/supabase-rest.mjs"));
  } catch (e) {
    console.log(
      `i18n:check skipped — no Supabase credentials (${
        e instanceof Error ? e.message : e
      })`,
    );
    return 0;
  }

  const rows = await select(
    "ui_translations?select=locale,namespace,key,value,default_hash",
  );

  if (rows.length === 0) {
    console.log("i18n:check — 0 overrides. The shipped JSON is what renders.");
    return 0;
  }

  const stale = rows.filter((r) =>
    isOverrideStale(r.default_hash, hashSeed(def("en", r.namespace, r.key), def("af", r.namespace, r.key))),
  );

  console.log(
    `i18n:check — ${rows.length} override${rows.length === 1 ? "" : "s"}, ` +
      `${stale.length} stale.`,
  );

  if (stale.length === 0) return 0;

  const blocking = stale.filter((r) => isClaimNamespace(r.namespace));
  const warning = stale.filter((r) => !isClaimNamespace(r.namespace));

  const report = (label: string, list: Row[]) => {
    if (list.length === 0) return;
    console.log(`\n${label}`);
    for (const r of list) {
      const shipped = def(r.locale, r.namespace, r.key);
      console.log(`  ${r.locale}  ${r.namespace}.${r.key}`);
      console.log(`      live (override): ${truncate(r.value)}`);
      console.log(
        `      code now ships:  ${
          shipped === undefined ? "(key no longer exists)" : truncate(shipped)
        }`,
      );
      if (r.default_hash === null) {
        console.log("      (row predates default_hash — drift unknown)");
      }
    }
  };

  report(
    `BLOCKING — stale in a claims-bearing namespace ` +
      `(${CLAIM_NAMESPACES.join(", ")}):`,
    blocking,
  );
  report("Warning — stale wording override:", warning);

  console.log(
    "\nThe override is what learners see. Reconcile in /admin/translations " +
      "(Stale filter) — reset to the shipped default, or re-save to accept it.",
  );

  return blocking.length > 0 ? 1 : 0;
}

process.exitCode = await main();
