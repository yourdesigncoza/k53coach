import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { LegalBlock, LegalDoc } from "@/lib/types";
import { OPERATOR } from "./operator.ts";
import { TERMS, REFUND_SECTION_IDS } from "./terms.ts";
import { PRIVACY } from "./privacy.ts";

/**
 * The verbatim guard.
 *
 * These two documents were supplied by the business and are published exactly
 * as supplied (docs/legal/README.md). That rule is only worth anything if
 * something checks it, so this compares the word stream of what the site
 * renders against the word stream of the source PDF's extracted text. A dropped
 * clause, a silently reworded sentence or a helpfully-added qualifier all fail
 * here, pointing at the first word that differs.
 *
 * If this fails after Louwrens sends a revision, the fix is to re-extract
 * docs/legal/*.txt from the new PDF first — never to bend the content module
 * until the test goes quiet.
 */

/**
 * Words of a document as the site renders it, in render order.
 *
 * This mirrors LegalDocument (src/components/legal/legal-document.tsx) — keep
 * the two in step. Modelling the render rather than running it is what let the
 * header's "Website:" line go missing from the page while this test stayed
 * green; the standing counter-check is to diff the served HTML, which is what
 * docs/legal/README.md tells you to do after any change here.
 */
function renderedWords(doc: LegalDoc): string[] {
  const out: string[] = [];
  const push = (s: string) => out.push(...words(s));
  const block = (b: LegalBlock) => {
    if (b.subheading) push(b.subheading);
    b.text?.forEach(push);
    b.lines?.forEach(push);
    b.bullets?.forEach(push);
  };

  push("K53 COACH");
  push(doc.title.toUpperCase());
  push(`Effective Date: ${doc.effectiveDate}`);
  push(`Website: ${OPERATOR.website}`);
  doc.intro.forEach(block);
  for (const section of doc.sections) {
    push(`${section.number}. ${section.heading}`);
    section.blocks.forEach(block);
  }
  if (doc.callout) {
    push(doc.callout.title);
    doc.callout.blocks.forEach(block);
  }
  push(doc.copyright);
  return out;
}

/** Words of the extracted PDF text. */
function sourceWords(file: string): string[] {
  const raw = readFileSync(new URL(`../../../docs/legal/${file}`, import.meta.url), "utf8");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  // pdftotext hard-wraps prose. Rejoin, honouring the one ambiguity: a line
  // ending in "-" is a split word when the next line continues in lower case
  // ("data-" + "protection"), but a real hyphen when it does not
  // ("…COOLING-OFF" + "RIGHTS").
  let joined = "";
  for (const line of lines) {
    if (!joined) joined = line;
    else if (joined.endsWith("-") && /^[a-z]/.test(line)) joined += line;
    else joined += ` ${line}`;
  }
  return words(joined);
}

/** Bullet markers are layout, not text; everything else is compared as-is. */
function words(s: string): string[] {
  return s.replace(/•/g, " ").split(/\s+/).filter(Boolean);
}

function assertVerbatim(doc: LegalDoc, file: string) {
  const rendered = renderedWords(doc);
  const source = sourceWords(file);

  const limit = Math.min(rendered.length, source.length);
  for (let i = 0; i < limit; i++) {
    if (rendered[i] !== source[i]) {
      const from = Math.max(0, i - 12);
      assert.fail(
        `${doc.slug}: diverges from ${file} at word ${i}\n` +
          `  source:   …${source.slice(from, i + 12).join(" ")}\n` +
          `  rendered: …${rendered.slice(from, i + 12).join(" ")}`,
      );
    }
  }
  assert.equal(
    rendered.length,
    source.length,
    `${doc.slug}: ${rendered.length} words rendered vs ${source.length} in ${file} — ` +
      `trailing text ${rendered.length > source.length ? "added" : "missing"}: ` +
      (rendered.length > source.length ? rendered : source).slice(limit).join(" "),
  );
}

test("terms are published verbatim", () => {
  assertVerbatim(TERMS, "terms-2026-08.txt");
});

test("privacy policy is published verbatim", () => {
  assertVerbatim(PRIVACY, "privacy-2026-08.txt");
});

test("every clause is present and numbered continuously", () => {
  for (const [doc, count] of [
    [TERMS, 33],
    [PRIVACY, 30],
  ] as const) {
    assert.equal(doc.sections.length, count, `${doc.slug}: clause count`);
    assert.deepEqual(
      doc.sections.map((s) => s.number),
      Array.from({ length: count }, (_, i) => String(i + 1)),
      `${doc.slug}: clause numbering`,
    );
  }
});

test("section ids are unique — they are anchors and the refund subset key", () => {
  for (const doc of [TERMS, PRIVACY]) {
    const ids = doc.sections.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${doc.slug}: duplicate section id`);
  }
});

test("the refund page's sections all exist in the terms", () => {
  const ids = new Set(TERMS.sections.map((s) => s.id));
  for (const id of REFUND_SECTION_IDS) {
    assert.ok(ids.has(id), `refund subset names a missing section: ${id}`);
  }
});

test("the paywall's money-back anchor exists", () => {
  // src/app/[locale]/paywall links /legal/refund#money-back. Renaming this id
  // silently breaks that link, so pin it.
  assert.ok(TERMS.sections.some((s) => s.id === "money-back"));
});
