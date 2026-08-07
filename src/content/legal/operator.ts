import type { LegalBlock } from "@/lib/types";

/**
 * Who operates K53 Coach, as stated in both published documents.
 *
 * Kept as facts rather than prose because the two documents print them in
 * different arrangements — the Terms header runs the address inline and labels
 * the number "Contact Number", Privacy §1 stacks the address and labels it
 * "Telephone". Composing both from one source means an address change is a
 * one-line edit instead of six scattered ones.
 *
 * Publishing these is not optional: ECTA §43 requires an electronic-transaction
 * provider to disclose its name, registration number, physical address and
 * contact details.
 */
export const OPERATOR = {
  legalName: "Luyt Family Holdings (Pty) Ltd T/A K53 Coach",
  registrationNumber: "2019/578073/07",
  website: "k53coach.co.za",
  email: "louwrens@willsdatabase.com",
  phone: "082 072 2182",
  /** Stacked form, as printed in Privacy §1 and in both contact clauses. */
  addressLines: [
    "908 Alverstoke Avenue",
    "Strubensvalley",
    "Roodepoort",
    "South Africa",
  ],
  /** Inline form, as printed in the Terms header. */
  addressInline:
    "908 Alverstoke Avenue, Strubensvalley, Roodepoort, South Africa",
  informationOfficer: "Louwrens Luyt",
} as const;

/**
 * The contact block printed identically at Terms §33 and Privacy §30. One
 * definition, used by both — the source really is word-for-word the same there.
 */
export const CONTACT_BLOCK: LegalBlock = {
  lines: [
    OPERATOR.legalName,
    `Website: ${OPERATOR.website}`,
    `Email: ${OPERATOR.email}`,
    `Telephone: ${OPERATOR.phone}`,
    "Physical/Registered Address:",
    ...OPERATOR.addressLines,
  ],
};
