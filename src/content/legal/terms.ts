import type { LegalDoc } from "@/lib/types";
// Explicit .ts: this module is unit-tested under node --experimental-strip-types,
// which needs the extension on relative value imports (see exam.test.ts).
import { CONTACT_BLOCK, OPERATOR } from "./operator.ts";

/**
 * Terms and Conditions, Cancellation & Refund Policy — as supplied by the
 * business on Linear K53-53 (Louwrens Luyt, 2026-08-07).
 *
 * ⚠️ PUBLISHED VERBATIM. Do not reword, condense, "improve" or drop a clause.
 * The reference text is docs/legal/terms-2026-08.txt; a change to this file that
 * does not correspond to a change in that file is a defect. Read
 * docs/legal/README.md before editing.
 *
 * Section ids are load-bearing: `money-back` is deep-linked from the paywall and
 * REFUND_SECTION_IDS below picks the /legal/refund subset out of this same data,
 * so there is never a second copy of the refund clauses to drift.
 */
export const TERMS: LegalDoc = {
  slug: "terms",
  title: "Terms and Conditions, Cancellation & Refund Policy",
  effectiveDate: "August 2026",
  pdf: "/legal/k53-coach-terms-2026-08.pdf",
  copyright:
    "© 2026 Luyt Family Holdings (Pty) Ltd T/A K53 Coach. All rights reserved.",

  intro: [
    {
      text: [
        "These Terms and Conditions govern access to and use of the K53 Coach website, educational platform, digital learning material, assessments, practice examinations, learning tools and related services.",
        "K53 Coach is operated by:",
      ],
    },
    {
      lines: [
        OPERATOR.legalName,
        "Registered in the Republic of South Africa",
        `Physical/Registered Address: ${OPERATOR.addressInline}`,
        `Email: ${OPERATOR.email}`,
        `Contact Number: ${OPERATOR.phone}`,
        `Company Registration Number: ${OPERATOR.registrationNumber}`,
      ],
    },
    {
      text: [
        "By registering for, purchasing or using K53 Coach, the user agrees to these Terms and Conditions.",
      ],
    },
  ],

  sections: [
    {
      id: "definitions",
      number: "1",
      heading: "DEFINITIONS",
      blocks: [
        {
          text: [
            "For purposes of these Terms:",
            "“K53 Coach” means the digital educational platform operated by Luyt Family Holdings (Pty) Ltd.",
            "“User” means an individual learner, parent/guardian, school or authorised school representative accessing or using the Platform.",
            "“Learner” means a person using K53 Coach for educational and learner-licence preparation purposes.",
            "“School” means an educational institution that purchases or receives authorised access to K53 Coach for its learners.",
            "“Platform” means the K53 Coach website, software, learning material, practice questions, examinations, explanations, graphics, educational resources and related digital services.",
            "“Account” means the registered profile through which a User accesses K53 Coach.",
          ],
        },
      ],
    },
    {
      id: "purpose",
      number: "2",
      heading: "PURPOSE OF K53 COACH",
      blocks: [
        {
          text: [
            "K53 Coach is an educational platform designed to assist learners in preparing for the South African K53 learner’s licence examination and related road-safety knowledge.",
            "The Platform may include:",
          ],
          bullets: [
            "educational lessons;",
            "Rules of the Road;",
            "road signs and road markings;",
            "vehicle controls;",
            "practice questions;",
            "mock examinations;",
            "explanations and feedback;",
            "learner progress information;",
            "examination preparation tools; and",
            "other educational functionality made available from time to time.",
          ],
        },
        {
          text: [
            "K53 Coach is an educational preparation platform and is not an official government examination platform.",
          ],
        },
      ],
    },
    {
      id: "no-guarantee",
      number: "3",
      heading: "NO GUARANTEE OF PASSING",
      blocks: [
        {
          text: [
            "K53 Coach is designed to assist Users with preparation.",
            "Use of the Platform does not guarantee that a learner will pass the official South African learner’s licence examination.",
            "Examination questions, procedures, requirements and legislation may change from time to time.",
            "K53 Coach will take reasonable steps to maintain accurate and current educational information but cannot guarantee that every question appearing in an official examination will appear on the Platform.",
            "Learners remain responsible for adequately preparing themselves and complying with official testing requirements.",
          ],
        },
      ],
    },
    {
      id: "eligible-users",
      number: "4",
      heading: "ELIGIBLE USERS",
      blocks: [
        {
          text: ["K53 Coach may be used by:"],
          bullets: ["individual learners; and", "schools and their authorised learners."],
        },
        {
          text: [
            "Where a learner is legally required to obtain the consent or assistance of a parent or guardian to enter into an agreement or use the Platform, the parent or guardian must provide the necessary consent.",
            "Schools are responsible for ensuring that access provided to their learners is properly authorised and managed.",
          ],
        },
      ],
    },
    {
      id: "registration",
      number: "5",
      heading: "REGISTRATION AND ACCOUNTS",
      blocks: [
        {
          text: [
            "Users may be required to create an account before accessing certain services.",
            "Users must provide accurate, complete and current information.",
            "Users are responsible for keeping usernames, passwords and other login credentials confidential.",
            "Users may not sell, transfer, lend or provide their personal account to an unauthorised person.",
            "K53 Coach may temporarily suspend an account where there are reasonable grounds to suspect fraud, misuse, unauthorised account sharing or a security breach.",
          ],
        },
      ],
    },
    {
      id: "payment",
      number: "6",
      heading: "PAYMENT",
      blocks: [
        {
          text: [
            "K53 Coach operates on a once-off payment model, unless a different product or arrangement is expressly identified on the Website.",
            "The applicable price will be displayed before the User completes the transaction.",
            "Prices are quoted in South African Rand (ZAR), unless expressly stated otherwise.",
            "The User will be given an opportunity to review the transaction before completing payment.",
            "Access is subject to successful payment or other authorised activation.",
          ],
        },
      ],
    },
    {
      id: "digital-access",
      number: "7",
      heading: "IMMEDIATE DIGITAL ACCESS",
      blocks: [
        {
          text: [
            "Once payment has been successfully processed, the User will normally receive immediate digital access to the purchased K53 Coach service or educational product.",
            "No physical product is supplied unless expressly stated otherwise.",
            "Because K53 Coach is a digital educational service, access may commence immediately after successful payment.",
          ],
        },
      ],
    },
    {
      id: "money-back",
      number: "8",
      heading: "K53 COACH 7-DAY MONEY-BACK GUARANTEE",
      blocks: [
        {
          text: [
            "In addition to any rights that a consumer may have under applicable South African law, K53 Coach provides a 7-Day Money-Back Guarantee on qualifying purchases.",
            "A customer may request cancellation and a full refund within seven (7) calendar days from the date of purchase, subject to these Terms.",
            "The customer does not need to continue using the Platform after submitting a cancellation request.",
            "Once a valid refund request has been approved, access to the relevant K53 Coach product or service may be terminated.",
            "This voluntary guarantee does not limit or remove any rights a consumer may have under applicable South African consumer law.",
          ],
        },
      ],
    },
    {
      id: "refund-requests",
      number: "9",
      heading: "HOW TO REQUEST A REFUND",
      blocks: [
        {
          text: ["Refund requests must be submitted in writing to:"],
          lines: [OPERATOR.email],
        },
        {
          text: [
            "The request should contain sufficient information to identify the transaction, including where applicable:",
          ],
          bullets: [
            "customer’s full name;",
            "email address used for registration;",
            "date of purchase;",
            "proof or reference of payment; and",
            "account details or other information reasonably required to identify the transaction.",
          ],
        },
        {
          text: [
            "The refund request must be received within the applicable seven-day period to qualify under the K53 Coach 7-Day Money-Back Guarantee.",
          ],
        },
      ],
    },
    {
      id: "refunds-after-7-days",
      number: "10",
      heading: "REFUNDS AFTER SEVEN DAYS",
      blocks: [
        {
          text: [
            "Once seven (7) calendar days have passed from the date of purchase, the voluntary K53 Coach 7-Day Money-Back Guarantee expires.",
            "Refunds will generally not be provided merely because the User:",
          ],
          bullets: [
            "changes their mind;",
            "no longer wishes to study;",
            "has already written their learner’s licence examination;",
            "fails their learner’s licence examination;",
            "does not use the Platform;",
            "loses their login credentials;",
            "purchases access accidentally but does not notify K53 Coach within the seven-day period; or",
            "decides that they no longer require the educational service.",
          ],
        },
        {
          text: [
            "However, nothing in this clause excludes or restricts a consumer’s rights where a refund, remedy or other relief is required under applicable South African law.",
          ],
        },
      ],
    },
    {
      id: "duplicate-payments",
      number: "11",
      heading: "DUPLICATE OR INCORRECT PAYMENTS",
      blocks: [
        {
          text: [
            "Where a customer has accidentally been charged more than once for the same transaction, K53 Coach will investigate the transaction and refund any verified duplicate payment where appropriate.",
            "Users should contact K53 Coach as soon as reasonably possible after identifying a duplicate or incorrect charge.",
          ],
        },
      ],
    },
    {
      id: "technical-problems",
      number: "12",
      heading: "TECHNICAL PROBLEMS",
      blocks: [
        {
          text: [
            "Users experiencing technical problems should contact K53 Coach so that reasonable steps can be taken to resolve the problem.",
            "Where K53 Coach is unable to provide the purchased service due to a material technical problem attributable to K53 Coach, the User may be entitled to an appropriate remedy in accordance with these Terms and applicable law.",
            "Temporary interruptions caused by maintenance, upgrades, internet service providers, third-party hosting providers or circumstances reasonably outside K53 Coach’s control do not automatically entitle a User to a refund.",
            "This does not limit any statutory rights that cannot lawfully be excluded.",
          ],
        },
      ],
    },
    {
      id: "cancellation",
      number: "13",
      heading: "CANCELLATION OF ACCESS",
      blocks: [
        {
          text: [
            "A User may request that their account be closed.",
            "Closing an account after the seven-day refund period does not automatically create a right to a refund.",
            "K53 Coach may suspend or terminate access where a User materially breaches these Terms, including through fraud, unlawful conduct, unauthorised distribution of educational content, account sharing or attempts to compromise the Platform.",
            "Where appropriate, the User will be given reasonable notice and an opportunity to remedy the breach, subject to applicable law and the nature of the breach.",
          ],
        },
      ],
    },
    {
      id: "personal-use",
      number: "14",
      heading: "PERSONAL USE",
      blocks: [
        {
          text: [
            "Individual purchases are licensed for the personal educational use of the registered User.",
            "A User may not:",
          ],
          bullets: [
            "sell K53 Coach content;",
            "publish or redistribute examination questions or learning material;",
            "copy substantial portions of the database;",
            "upload the material to another website or learning platform;",
            "distribute login credentials;",
            "commercially exploit the Platform;",
            "reproduce K53 Coach material for competing educational services; or",
            "systematically extract, scrape or download Platform content.",
          ],
        },
      ],
    },
    {
      id: "school-use",
      number: "15",
      heading: "SCHOOL USE",
      blocks: [
        {
          text: [
            "Schools may use K53 Coach for legitimate educational purposes subject to the licence or access arrangement purchased by the school.",
            "School access does not give a school unrestricted ownership of K53 Coach’s intellectual property.",
            "Unless expressly authorised in writing, schools may not reproduce, sell, distribute, publish or commercially exploit K53 Coach content outside their authorised educational use.",
            "Access may only be provided to the number of learners or Users permitted by the applicable school package.",
          ],
        },
      ],
    },
    {
      id: "intellectual-property",
      number: "16",
      heading: "INTELLECTUAL PROPERTY",
      blocks: [
        {
          text: [
            "Unless otherwise indicated, all intellectual property associated with K53 Coach remains the property of Luyt Family Holdings (Pty) Ltd or the relevant lawful rights holder.",
            "This may include:",
          ],
          bullets: [
            "K53 Coach branding;",
            "logos;",
            "website design;",
            "databases;",
            "educational explanations;",
            "question banks;",
            "examination structures;",
            "illustrations;",
            "graphics;",
            "road-sign and road-marking educational material;",
            "software;",
            "written material;",
            "videos;",
            "audio;",
            "algorithms;",
            "learner analytics; and",
            "original educational content.",
          ],
        },
        {
          text: [
            "Purchasing access gives the User a limited right to use the Platform. It does not transfer ownership of the intellectual property to the User.",
          ],
        },
      ],
    },
    {
      id: "copyright",
      number: "17",
      heading: "COPYRIGHT AND UNAUTHORISED COPYING",
      blocks: [
        {
          text: [
            "Users may not reproduce, distribute, sell, modify or commercially exploit copyrighted K53 Coach content without prior written permission.",
            "Reasonable educational use permitted under the User’s applicable licence remains allowed.",
            "K53 Coach reserves the right to take appropriate action where its intellectual property is unlawfully copied, distributed or commercially exploited.",
          ],
        },
      ],
    },
    {
      id: "availability",
      number: "18",
      heading: "PLATFORM AVAILABILITY",
      blocks: [
        {
          text: [
            "K53 Coach will take reasonable steps to keep the Platform operational and accessible.",
            "However, uninterrupted access cannot be guaranteed.",
            "Temporary downtime may occur because of:",
          ],
          bullets: [
            "maintenance;",
            "security updates;",
            "software upgrades;",
            "hosting problems;",
            "internet outages;",
            "payment-provider interruptions;",
            "technical failures; or",
            "circumstances outside K53 Coach’s reasonable control.",
          ],
        },
        {
          text: [
            "Where reasonably possible, material planned interruptions will be minimised.",
          ],
        },
      ],
    },
    {
      id: "accuracy",
      number: "19",
      heading: "ACCURACY OF EDUCATIONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach aims to provide accurate educational material based on South African K53 learner-licence requirements and applicable road-traffic rules.",
            "Road-traffic legislation, examination procedures and official requirements may change.",
            "Users should therefore also follow current instructions and requirements issued by the relevant South African licensing and government authorities.",
          ],
        },
      ],
    },
    {
      id: "liability",
      number: "20",
      heading: "LIMITATION OF LIABILITY",
      blocks: [
        {
          text: [
            "To the maximum extent permitted by South African law, K53 Coach will not be responsible for indirect or consequential loss arising merely from a User’s reliance on educational preparation material.",
            "K53 Coach does not accept responsibility for a learner failing an official learner’s licence examination.",
            "Nothing in these Terms excludes liability or consumer rights where such exclusion is prohibited by the Consumer Protection Act, ECTA or other applicable South African legislation.",
          ],
        },
      ],
    },
    {
      id: "conduct",
      number: "21",
      heading: "USER CONDUCT",
      blocks: [
        {
          text: ["Users must not use K53 Coach to:"],
          bullets: [
            "commit fraud;",
            "gain unauthorised access to another person’s account;",
            "interfere with the Platform’s security;",
            "introduce malicious software;",
            "scrape or systematically extract content;",
            "circumvent technical protection measures;",
            "impersonate another User;",
            "distribute stolen login credentials; or",
            "use the Platform for unlawful purposes.",
          ],
        },
      ],
    },
    {
      id: "privacy",
      number: "22",
      heading: "PRIVACY AND PERSONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach may collect and process personal information required to provide accounts, educational services, payments, learner progress information, support and Platform security.",
            "Personal information must be handled in accordance with applicable South African data-protection legislation, including the Protection of Personal Information Act 4 of 2013 (POPIA).",
            "The collection and processing of personal information should additionally be governed by K53 Coach’s separate Privacy Policy.",
            "Where schools provide information relating to learners, the school must ensure that it has the appropriate authority or lawful basis to provide that information.",
          ],
        },
      ],
    },
    {
      id: "payment-security",
      number: "23",
      heading: "PAYMENT SECURITY",
      blocks: [
        {
          text: [
            "K53 Coach will use payment systems and/or payment service providers intended to provide appropriate security for electronic transactions.",
            "K53 Coach does not intentionally store full payment-card information where payment processing is performed directly by an authorised third-party payment provider.",
            "Users remain responsible for protecting their own account and payment credentials.",
          ],
        },
      ],
    },
    {
      id: "electronic-communication",
      number: "24",
      heading: "ELECTRONIC COMMUNICATION",
      blocks: [
        {
          text: [
            "By using the Platform, Users consent to receiving communications necessary for administering their account, transaction or educational service electronically.",
            "Marketing communications will be managed separately and subject to applicable South African law.",
          ],
        },
      ],
    },
    {
      id: "platform-changes",
      number: "25",
      heading: "CHANGES TO THE PLATFORM",
      blocks: [
        {
          text: [
            "K53 Coach may improve, update or modify Platform features, educational material, questions and functionality from time to time.",
            "Changes may be necessary to improve educational quality, security, legal compliance or functionality.",
            "Material changes will not remove statutory consumer rights.",
          ],
        },
      ],
    },
    {
      id: "terms-changes",
      number: "26",
      heading: "CHANGES TO THESE TERMS",
      blocks: [
        {
          text: [
            "K53 Coach may update these Terms and Conditions from time to time.",
            "The version applicable to a transaction will generally be the version made available when the relevant transaction was concluded, except where a change is required by law or where otherwise lawfully agreed.",
            "The current Terms will be made available on the Website.",
          ],
        },
      ],
    },
    {
      id: "consumer-law",
      number: "27",
      heading: "SOUTH AFRICAN CONSUMER LAW",
      blocks: [
        {
          text: [
            "These Terms must be interpreted consistently with applicable South African legislation.",
            "Relevant legislation may include, where applicable:",
          ],
          lines: [
            "Consumer Protection Act 68 of 2008 (CPA)",
            "Electronic Communications and Transactions Act 25 of 2002 (ECTA)",
            "Protection of Personal Information Act 4 of 2013 (POPIA)",
            "and other applicable South African legislation.",
          ],
        },
        {
          text: [
            "Nothing contained in these Terms is intended to waive, restrict or remove any statutory consumer right that cannot lawfully be waived or restricted.",
          ],
        },
      ],
    },
    {
      id: "cooling-off",
      number: "28",
      heading: "ELECTRONIC TRANSACTIONS AND COOLING-OFF RIGHTS",
      blocks: [
        {
          text: [
            "Certain electronic transactions may qualify for statutory cooling-off rights under the Electronic Communications and Transactions Act.",
            "The applicability of those statutory rights depends on the nature and circumstances of the transaction, and ECTA contains specified exclusions.",
            "In particular, statutory cooling-off provisions may not apply in certain circumstances where the provision of services has begun with the consumer’s consent before expiry of the applicable cooling-off period.",
            "Regardless of whether the statutory cooling-off right applies to a particular K53 Coach transaction, K53 Coach provides its own 7-Day Money-Back Guarantee as described in these Terms.",
            "Nothing in this section limits any statutory right available to a particular consumer.",
          ],
        },
      ],
    },
    {
      id: "disputes",
      number: "29",
      heading: "DISPUTES AND COMPLAINTS",
      blocks: [
        {
          text: [
            "Users should first contact K53 Coach so that reasonable efforts can be made to resolve a complaint.",
            "Complaints may be submitted to:",
          ],
          lines: [`Email: ${OPERATOR.email}`, `Telephone: ${OPERATOR.phone}`],
        },
        {
          text: [
            "If a dispute cannot be resolved directly, a consumer may exercise any rights available under applicable South African law, including approaching an appropriate consumer-protection body or other competent authority where applicable.",
          ],
        },
      ],
    },
    {
      id: "governing-law",
      number: "30",
      heading: "GOVERNING LAW",
      blocks: [
        {
          text: [
            "These Terms and Conditions are governed by the laws of the Republic of South Africa.",
            "Any dispute will be dealt with in accordance with applicable South African law and the jurisdiction of the appropriate South African courts or other competent dispute-resolution bodies.",
          ],
        },
      ],
    },
    {
      id: "severability",
      number: "31",
      heading: "SEVERABILITY",
      blocks: [
        {
          text: [
            "If any provision of these Terms is found to be unlawful, invalid or unenforceable, that provision will, to the extent permitted by law, be separated from the remaining provisions.",
            "The remainder of the Terms will continue to apply.",
          ],
        },
      ],
    },
    {
      id: "entire-agreement",
      number: "32",
      heading: "ENTIRE AGREEMENT",
      blocks: [
        {
          text: [
            "These Terms, together with the applicable Privacy Policy, product description, payment information and any other terms expressly incorporated into the transaction, constitute the agreement governing use of the relevant K53 Coach service.",
          ],
        },
      ],
    },
    {
      id: "contact",
      number: "33",
      heading: "CONTACT DETAILS",
      blocks: [
        {
          text: [
            "For cancellations, refunds, support or questions regarding these Terms:",
          ],
        },
        CONTACT_BLOCK,
      ],
    },
  ],

  callout: {
    title: "IMPORTANT REFUND SUMMARY",
    blocks: [
      {
        text: [
          "Changed your mind within 7 days?",
          "K53 Coach offers a 7-Day Money-Back Guarantee.",
        ],
        lines: [
          "✓ Request cancellation within 7 calendar days of purchase.",
          `✓ Send the request to ${OPERATOR.email}.`,
          "✓ Qualifying requests receive a full refund.",
          "✓ Access may be cancelled once the refund is processed.",
        ],
      },
      {
        text: [
          "After 7 days: The voluntary money-back guarantee expires, but this does not remove any rights or remedies you may have under South African law.",
        ],
      },
    ],
  },
};

/**
 * The clauses that make up the cancellation & refund policy, in printed order.
 *
 * `/legal/refund` exists because payment providers look for a dedicated refund
 * URL. It renders these sections out of TERMS above rather than restating them,
 * so the refund policy cannot drift from the Terms it is part of.
 */
export const REFUND_SECTION_IDS = [
  "money-back",
  "refund-requests",
  "refunds-after-7-days",
  "duplicate-payments",
  "technical-problems",
  "cancellation",
  "consumer-law",
  "cooling-off",
  "disputes",
  "contact",
] as const;
