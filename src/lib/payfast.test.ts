import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  amountMatches,
  buildPaymentRequest,
  itnSignature,
  parseItnBody,
  PAYMENT_FIELD_ORDER,
  paymentRequestSignature,
  payfastUrlEncode,
  signaturesMatch,
  type PayfastConfig,
} from "./payfast.ts";

/**
 * These lock down the encoding and ordering rules that make or break a PayFast
 * signature. They are behavioural, not golden-vector, tests: the definitive check
 * is a sandbox transaction, but every rule asserted here is one that silently
 * produces "generated signature does not match submitted signature" when wrong.
 */

describe("payfastUrlEncode", () => {
  test("encodes spaces as + like PHP urlencode, not %20", () => {
    assert.equal(payfastUrlEncode("Coach K"), "Coach+K");
  });

  test("leaves -_. unescaped", () => {
    assert.equal(payfastUrlEncode("a-b_c.d"), "a-b_c.d");
  });

  test("escapes !'()*~ which encodeURIComponent would leave alone", () => {
    assert.equal(payfastUrlEncode("~"), "%7E");
    assert.equal(payfastUrlEncode("!"), "%21");
    assert.equal(payfastUrlEncode("'"), "%27");
    assert.equal(payfastUrlEncode("("), "%28");
    assert.equal(payfastUrlEncode(")"), "%29");
    assert.equal(payfastUrlEncode("*"), "%2A");
  });

  test("uses uppercase hex", () => {
    assert.equal(payfastUrlEncode("a/b"), "a%2Fb");
    assert.equal(payfastUrlEncode("a@b"), "a%40b");
  });

  test("encodes an email address the way the gateway expects", () => {
    assert.equal(
      payfastUrlEncode("learner+test@k53coach.co.za"),
      "learner%2Btest%40k53coach.co.za",
    );
  });
});

describe("paymentRequestSignature", () => {
  const fields = [
    ["merchant_id", "16039254"],
    ["merchant_key", "abcdefghijklm"],
    ["amount", "179.00"],
    ["item_name", "K53 AI Coach"],
  ] as const;

  test("is a 32-char hex md5", () => {
    assert.match(paymentRequestSignature([...fields], ""), /^[0-9a-f]{32}$/);
  });

  test("field order changes the signature", () => {
    const reordered = [fields[1], fields[0], fields[2], fields[3]];
    assert.notEqual(
      paymentRequestSignature([...fields], ""),
      paymentRequestSignature([...reordered], ""),
    );
  });

  test("the passphrase changes the signature", () => {
    assert.notEqual(
      paymentRequestSignature([...fields], ""),
      paymentRequestSignature([...fields], "SomePassphrase123"),
    );
  });

  test("empty fields are omitted entirely, not sent as key=", () => {
    const withEmpty = [...fields, ["custom_str2", "   "] as const];
    assert.equal(
      paymentRequestSignature([...withEmpty], ""),
      paymentRequestSignature([...fields], ""),
      "a blank optional field must not alter the signature",
    );
  });

  test("values are hashed verbatim, NOT trimmed", () => {
    // PayFast hashes exactly what crossed the wire. Trimming here would compute a
    // signature over a different string than PayFast signed — which is why
    // whitespace is stripped at config load instead. Credentials pasted with a
    // stray space are caught by env(), not by mangling the hashed payload.
    const padded = [
      ["merchant_id", " 16039254 "],
      ["merchant_key", "abcdefghijklm"],
      ["amount", "179.00"],
      ["item_name", "K53 AI Coach"],
    ] as const;
    assert.notEqual(
      paymentRequestSignature([...padded], ""),
      paymentRequestSignature([...fields], ""),
    );
  });

  test("a whitespace-only field still counts as empty and is dropped", () => {
    const withBlank = [...fields, ["custom_str2", "   "] as const];
    assert.equal(
      paymentRequestSignature([...withBlank], ""),
      paymentRequestSignature([...fields], ""),
    );
  });
});

describe("itnSignature", () => {
  const body =
    "m_payment_id=k53-1&pf_payment_id=1089250&payment_status=COMPLETE" +
    "&item_name=K53+AI+Coach&amount_gross=179.00&custom_str2=" +
    "&signature=ignoreme";

  test("excludes the signature field itself", () => {
    const pairs = parseItnBody(body);
    const withoutSig = pairs.filter(([k]) => k !== "signature");
    assert.equal(
      itnSignature(pairs, "pass"),
      itnSignature(withoutSig, "pass"),
    );
  });

  test("KEEPS empty values, unlike the request path", () => {
    const pairs = parseItnBody(body);
    const withoutEmpty = pairs.filter(([, v]) => v !== "");
    assert.notEqual(
      itnSignature(pairs, "pass"),
      itnSignature(withoutEmpty, "pass"),
      "an empty ITN field is part of the hashed string",
    );
  });

  test("received order is preserved by parseItnBody", () => {
    assert.deepEqual(
      parseItnBody("b=2&a=1&c=3").map(([k]) => k),
      ["b", "a", "c"],
    );
  });

  test("reordering the received fields changes the signature", () => {
    const pairs = parseItnBody("a=1&b=2&c=3");
    const swapped = [pairs[2], pairs[1], pairs[0]];
    assert.notEqual(itnSignature(pairs, ""), itnSignature(swapped, ""));
  });
});

describe("signaturesMatch", () => {
  const sig = "9c1e2f3a4b5c6d7e8f90a1b2c3d4e5f6";

  test("matches case-insensitively and ignores surrounding space", () => {
    assert.ok(signaturesMatch(sig, ` ${sig.toUpperCase()} `));
  });

  test("rejects a different signature", () => {
    assert.ok(!signaturesMatch(sig, sig.replace(/^9/, "8")));
  });

  test("rejects empty and length-mismatched input", () => {
    assert.ok(!signaturesMatch("", ""));
    assert.ok(!signaturesMatch(sig, sig.slice(0, 20)));
  });
});

describe("buildPaymentRequest", () => {
  const sandbox: PayfastConfig = {
    mode: "sandbox",
    merchantId: "10000100",
    merchantKey: "46f0cd694581a",
    passphrase: "jt7NOE43FZPn",
  };
  const input = {
    amountZar: 179,
    itemName: "K53 AI Coach — 90 days full access",
    paymentId: "k53-abc",
    userId: "27b18610-0000-4000-8000-000000000000",
    email: "learner@k53coach.co.za",
    returnUrl: "https://k53coach.co.za/dashboard",
    cancelUrl: "https://k53coach.co.za/paywall",
    notifyUrl: "https://k53coach.co.za/api/pay/payfast",
  };

  test("posts to the sandbox gateway when mode is sandbox", () => {
    assert.equal(
      buildPaymentRequest(sandbox, input).url,
      "https://sandbox.payfast.co.za/eng/process",
    );
  });

  test("posts to the live gateway when mode is live", () => {
    assert.equal(
      buildPaymentRequest({ ...sandbox, mode: "live" }, input).url,
      "https://www.payfast.co.za/eng/process",
    );
  });

  test("emits fields in PayFast's documented order", () => {
    const keys = buildPaymentRequest(sandbox, input)
      .fields.map(([k]) => k)
      .filter((k) => k !== "signature");
    const expectedRelativeOrder = keys
      .map((k) => PAYMENT_FIELD_ORDER.indexOf(k as never))
      .filter((i) => i >= 0);
    assert.deepEqual(
      expectedRelativeOrder,
      [...expectedRelativeOrder].sort((a, b) => a - b),
      "fields must follow PAYMENT_FIELD_ORDER or the signature is invalid",
    );
  });

  test("signature comes last and is a 32-char hex md5", () => {
    const { fields } = buildPaymentRequest(sandbox, input);
    const [name, value] = fields[fields.length - 1];
    assert.equal(name, "signature");
    assert.match(value, /^[0-9a-f]{32}$/);
  });

  test("the emitted signature matches the emitted fields", () => {
    const { fields } = buildPaymentRequest(sandbox, input);
    const body = fields.filter(([k]) => k !== "signature");
    const claimed = fields.find(([k]) => k === "signature")![1];
    assert.equal(claimed, paymentRequestSignature(body, sandbox.passphrase));
  });

  test("amount is formatted to 2dp", () => {
    const amount = buildPaymentRequest(sandbox, input).fields.find(
      ([k]) => k === "amount",
    )![1];
    assert.equal(amount, "179.00");
  });

  test("custom_str1 carries the user id for the ITN to grant", () => {
    const custom = buildPaymentRequest(sandbox, input).fields.find(
      ([k]) => k === "custom_str1",
    )![1];
    assert.equal(custom, input.userId);
  });

  test("omits optional fields that weren't supplied", () => {
    const keys = buildPaymentRequest(sandbox, {
      ...input,
      email: undefined,
    }).fields.map(([k]) => k);
    assert.ok(!keys.includes("email_address"));
    assert.ok(!keys.includes("name_last"));
    assert.ok(!keys.includes("cell_number"));
  });
});

describe("amountMatches", () => {
  test("accepts the exact price in gateway format", () => {
    assert.ok(amountMatches("179.00", 179));
  });

  test("tolerates one cent of rounding", () => {
    assert.ok(amountMatches("178.99", 179));
    assert.ok(amountMatches("179.01", 179));
  });

  test("rejects an underpayment", () => {
    assert.ok(!amountMatches("1.00", 179));
    assert.ok(!amountMatches("178.50", 179));
  });

  test("rejects junk rather than coercing it", () => {
    assert.ok(!amountMatches("", 179));
    assert.ok(!amountMatches("free", 179));
  });
});
