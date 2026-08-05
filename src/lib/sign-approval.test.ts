import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, shouldStampApproval } from "./sign-approval.ts";

const CONTENT = {
  plainEnglish: { en: "The safe speed.", af: "Die veilige spoed." },
  testHint: { en: "Check where the number sits.", af: "Kyk waar die syfer sit." },
};

test("no stamp when the save does not land on approved", () => {
  for (const reviewStatus of ["draft", "needs_review", "withdrawn"]) {
    assert.equal(
      shouldStampApproval(
        { review_status: "approved", content: CONTENT },
        { reviewStatus, content: { ...CONTENT, testHint: { en: "changed" } } },
      ),
      false,
      `${reviewStatus} must not stamp even with edited content`,
    );
  }
});

test("stamps when a not-yet-approved sign becomes approved", () => {
  assert.equal(
    shouldStampApproval(
      { review_status: "draft", content: CONTENT },
      { reviewStatus: "approved", content: CONTENT },
    ),
    true,
  );
});

test("stamps when approved content is edited — the old approval no longer covers it", () => {
  assert.equal(
    shouldStampApproval(
      { review_status: "approved", content: CONTENT },
      {
        reviewStatus: "approved",
        content: { ...CONTENT, plainEnglish: { en: "Rewritten.", af: "Herskryf." } },
      },
    ),
    true,
  );
});

test("does NOT stamp an unchanged re-save — a reviewer's sign-off must survive someone else opening the sign", () => {
  assert.equal(
    shouldStampApproval(
      { review_status: "approved", content: CONTENT },
      { reviewStatus: "approved", content: CONTENT },
    ),
    false,
  );
});

test("key order must not read as an edit (the regression this predicate guards)", () => {
  // Same content, keys emitted in a different order — what PostgREST vs the
  // editor form can legitimately produce. A textual compare would re-stamp here
  // and overwrite the real approver.
  const reordered = {
    testHint: { af: CONTENT.testHint.af, en: CONTENT.testHint.en },
    plainEnglish: { af: CONTENT.plainEnglish.af, en: CONTENT.plainEnglish.en },
  };
  assert.notEqual(
    JSON.stringify(CONTENT),
    JSON.stringify(reordered),
    "fixture must actually differ textually, or this test proves nothing",
  );
  assert.equal(
    shouldStampApproval(
      { review_status: "approved", content: CONTENT },
      { reviewStatus: "approved", content: reordered },
    ),
    false,
  );
});

test("a null/empty prior content still counts as a change when text is added", () => {
  assert.equal(
    shouldStampApproval(
      { review_status: "approved", content: {} },
      { reviewStatus: "approved", content: CONTENT },
    ),
    true,
  );
  assert.equal(
    shouldStampApproval(
      { review_status: "approved", content: null },
      { reviewStatus: "approved", content: {} },
    ),
    false,
    "null and {} are the same empty lesson",
  );
});

test("canonicalJson is order-independent but value-sensitive", () => {
  assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
  assert.notEqual(canonicalJson({ a: 1 }), canonicalJson({ a: 2 }));
  assert.equal(canonicalJson({ a: [1, { y: 1, x: 2 }] }), canonicalJson({ a: [1, { x: 2, y: 1 }] }));
  assert.notEqual(
    canonicalJson({ a: [1, 2] }),
    canonicalJson({ a: [2, 1] }),
    "array order is meaningful and must not be sorted away",
  );
});
