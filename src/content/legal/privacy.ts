import type { LegalDoc } from "@/lib/types";
// Explicit .ts — see the note in terms.ts.
import { CONTACT_BLOCK, OPERATOR } from "./operator.ts";

/**
 * Privacy Policy — as supplied by the business on Linear K53-53
 * (Louwrens Luyt, 2026-08-07).
 *
 * ⚠️ `sections` IS PUBLISHED VERBATIM. Do not reword, condense, "improve" or
 * drop a supplied clause. The reference text is docs/legal/privacy-2026-08.txt;
 * a change to `sections` that does not correspond to a change in that file is a
 * defect.
 *
 * `amendments` is different, and was added deliberately (John, 2026-08-07):
 * while the site is in beta we ship what the product needs and audit the
 * documents when the business asks for it, rather than holding a feature until
 * a revised PDF arrives. A clause we write goes there, carries who added it,
 * when and why, and is published under its own number after the supplied
 * clauses. The verbatim guard still applies in full to everything supplied — an
 * undeclared addition anywhere still fails it. Read docs/legal/README.md before
 * editing either list.
 */
export const PRIVACY: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  effectiveDate: "August 2026",
  pdf: "/legal/k53-coach-privacy-2026-08.pdf",
  copyright:
    "© 2026 Luyt Family Holdings (Pty) Ltd T/A K53 Coach. All rights reserved.",

  intro: [
    {
      text: [
        "This Privacy Policy explains how Luyt Family Holdings (Pty) Ltd T/A K53 Coach (“K53 Coach”, “we”, “us” or “our”) collects, uses, stores, protects and processes personal information when individuals, learners and schools use the K53 Coach website and educational platform.",
        "We respect the privacy of our Users and are committed to processing personal information lawfully and responsibly in accordance with the Protection of Personal Information Act 4 of 2013 (“POPIA”) and other applicable South African laws.",
      ],
    },
  ],

  sections: [
    {
      id: "responsible-party",
      number: "1",
      heading: "RESPONSIBLE PARTY",
      blocks: [
        {
          text: ["For purposes of POPIA, the responsible party is:"],
          lines: [
            OPERATOR.legalName,
            `Website: ${OPERATOR.website}`,
            `Email: ${OPERATOR.email}`,
            `Telephone: ${OPERATOR.phone}`,
            "Physical/Registered Address:",
            ...OPERATOR.addressLines,
            `Company Registration Number: ${OPERATOR.registrationNumber}`,
          ],
        },
        {
          text: [
            "K53 Coach determines the purpose and means by which personal information processed through the Platform is used.",
          ],
        },
      ],
    },
    {
      id: "purpose",
      number: "2",
      heading: "PURPOSE OF THIS PRIVACY POLICY",
      blocks: [
        {
          text: ["This Privacy Policy explains:"],
          bullets: [
            "what personal information we collect;",
            "why we collect it;",
            "how we use it;",
            "how it is protected;",
            "when information may be shared;",
            "how long information is retained;",
            "how we handle children’s information;",
            "the rights Users have regarding their information; and",
            "how Users can contact us regarding privacy matters.",
          ],
        },
      ],
    },
    {
      id: "what-is-personal-information",
      number: "3",
      heading: "WHAT IS PERSONAL INFORMATION?",
      blocks: [
        {
          text: [
            "Personal information is information relating to an identifiable natural or juristic person as contemplated by POPIA.",
            "Depending on how K53 Coach is used, this may include a person’s name, telephone number, email address, account information, educational information, test results and other information capable of identifying or being linked to that person.",
          ],
        },
      ],
    },
    {
      id: "information-we-collect",
      number: "4",
      heading: "INFORMATION WE MAY COLLECT",
      blocks: [
        {
          text: [
            "K53 Coach aims to collect only personal information reasonably necessary to provide and improve the educational service.",
            "Information we may collect includes:",
          ],
        },
        {
          subheading: "4.1 Account and Contact Information",
          text: ["This may include:"],
          bullets: [
            "full name;",
            "email address;",
            "telephone or mobile number;",
            "username;",
            "account details; and",
            "login and authentication information.",
          ],
        },
        {
          subheading: "4.2 Educational Information",
          text: [
            "Because K53 Coach is an educational platform, we may process information about a User’s learning activity, including:",
          ],
          bullets: [
            "practice-test results;",
            "mock examination results;",
            "scores;",
            "answers submitted;",
            "incorrect and correct answers;",
            "learning progress;",
            "modules completed;",
            "areas requiring further study;",
            "readiness indicators;",
            "learning activity; and",
            "other information generated through use of the Platform.",
          ],
        },
        {
          subheading: "4.3 School-Related Information",
          text: [
            "Where access is provided through or in connection with a school, we may process information reasonably required to administer that access.",
            "We will endeavour not to collect unnecessary school or learner information.",
          ],
        },
        {
          subheading: "4.4 Transaction Information",
          text: [
            "When a User purchases access to K53 Coach, we may process information necessary to administer the transaction, including:",
          ],
          bullets: [
            "purchaser name;",
            "payment status;",
            "transaction reference;",
            "purchase date;",
            "amount paid; and",
            "relevant billing information.",
          ],
        },
        {
          text: [
            "Where payment is processed through a third-party payment service provider, payment-card information may be collected and processed directly by that provider.",
            "K53 Coach does not intend to store full payment-card details where those details are processed securely by an authorised payment provider.",
          ],
        },
        {
          subheading: "4.5 Technical Information",
          text: [
            "When Users access the Website or Platform, certain technical information may automatically be collected, such as:",
          ],
          bullets: [
            "IP address;",
            "browser type;",
            "device type;",
            "operating system;",
            "login activity;",
            "access dates and times;",
            "website usage information;",
            "security logs; and",
            "cookie or similar technology information.",
          ],
        },
        {
          text: [
            "This information may be used to operate, secure, maintain and improve the Platform.",
          ],
        },
      ],
    },
    {
      id: "how-we-collect",
      number: "5",
      heading: "HOW WE COLLECT PERSONAL INFORMATION",
      blocks: [
        {
          text: ["Personal information may be collected:"],
          bullets: [
            "directly from the User;",
            "when an account is created;",
            "when a purchase is made;",
            "when a User completes lessons or tests;",
            "automatically through use of the Platform;",
            "when a User contacts customer support;",
            "through cookies and related technologies;",
            "from a parent or guardian where appropriate; or",
            "from a school where the school is authorised to provide the relevant information.",
          ],
        },
        {
          text: [
            "Where reasonably practicable, personal information will be collected directly from the person concerned.",
          ],
        },
      ],
    },
    {
      id: "why-we-process",
      number: "6",
      heading: "WHY WE PROCESS PERSONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach may process personal information for legitimate and lawful purposes including:",
          ],
          bullets: [
            "creating and administering User accounts;",
            "providing access to purchased educational services;",
            "authenticating Users;",
            "processing transactions;",
            "recording test and examination results;",
            "tracking learning progress;",
            "identifying areas where a learner may require additional study;",
            "providing educational feedback;",
            "improving educational content;",
            "providing customer support;",
            "communicating important account or service information;",
            "preventing fraud and account misuse;",
            "maintaining Platform security;",
            "investigating technical problems;",
            "maintaining appropriate business and transaction records;",
            "complying with legal obligations; and",
            "protecting the legitimate rights and interests of K53 Coach and its Users.",
          ],
        },
        {
          text: [
            "We will not process personal information in a manner that is incompatible with the purpose for which it was collected unless permitted by law.",
          ],
        },
      ],
    },
    {
      id: "lawful-processing",
      number: "7",
      heading: "LAWFUL PROCESSING",
      blocks: [
        {
          text: [
            "K53 Coach will process personal information only where there is an appropriate lawful basis under POPIA.",
            "Depending on the circumstances, processing may be necessary:",
          ],
          bullets: [
            "with the User’s consent;",
            "to perform a contract with the User;",
            "to take steps requested by a User before entering into a contract;",
            "to comply with a legal obligation;",
            "to protect a legitimate interest of the User; or",
            "to pursue the legitimate interests of K53 Coach or a third party where permitted by law.",
          ],
        },
        {
          text: [
            "Where processing is based on consent, the User may withdraw that consent, subject to applicable law and any consequences of the withdrawal.",
          ],
        },
      ],
    },
    {
      id: "children",
      number: "8",
      heading: "CHILDREN’S PERSONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach recognises that some learners using the Platform may be children as defined under South African law.",
            "Children’s personal information receives additional protection under POPIA.",
            "Where POPIA requires the consent of a competent person, such as a parent or legal guardian, before K53 Coach may process a child’s personal information, the required consent must be obtained before the relevant processing takes place unless another lawful exception applies.",
            "K53 Coach may implement reasonable age-verification and parental or guardian consent procedures where appropriate.",
            "Parents or guardians may contact K53 Coach regarding personal information relating to a child for whom they are legally responsible.",
            "K53 Coach aims to collect only the information reasonably necessary to provide the educational service and will not intentionally collect unnecessary personal information from children.",
          ],
        },
      ],
    },
    {
      id: "school-users",
      number: "9",
      heading: "SCHOOL USERS",
      blocks: [
        {
          text: [
            "Schools may purchase or facilitate access to K53 Coach for learners.",
            "Where a school provides learner information to K53 Coach, the school must ensure that it is legally entitled to provide that information and that any consent or other lawful basis required for the disclosure has been obtained.",
            "K53 Coach remains responsible for the personal information for which it determines the purpose and means of processing.",
            "Where appropriate, K53 Coach may enter into suitable data-processing or information-sharing arrangements with schools.",
          ],
        },
      ],
    },
    {
      id: "analytics",
      number: "10",
      heading: "LEARNING PROGRESS AND ANALYTICS",
      blocks: [
        {
          text: [
            "K53 Coach may analyse learner activity to provide educational functions such as:",
          ],
          bullets: [
            "progress tracking;",
            "test scores;",
            "performance summaries;",
            "identification of weaker knowledge areas;",
            "revision recommendations;",
            "learner readiness indicators; and",
            "personalised educational feedback.",
          ],
        },
        {
          text: [
            "These functions are intended to support learning and examination preparation.",
            "A K53 Coach readiness score, progress indicator or recommendation is an educational tool only and does not guarantee that a learner will pass an official learner’s licence examination.",
          ],
        },
      ],
    },
    {
      id: "automated-processing",
      number: "11",
      heading: "AUTOMATED PROCESSING",
      blocks: [
        {
          text: [
            "Certain Platform functions may automatically analyse test results, answers and learning progress.",
            "Where automated systems are used, they are intended primarily to assist with educational feedback, progress tracking and Platform functionality.",
            "K53 Coach will endeavour to comply with POPIA where automated processing produces a decision that has legal consequences or otherwise significantly affects a person.",
          ],
        },
      ],
    },
    {
      id: "sharing",
      number: "12",
      heading: "SHARING PERSONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach does not sell Users’ personal information.",
            "Personal information may be disclosed only where reasonably necessary and lawful, including to service providers that assist us with:",
          ],
          bullets: [
            "website hosting;",
            "cloud storage;",
            "payment processing;",
            "email delivery;",
            "cybersecurity;",
            "technical support;",
            "software infrastructure;",
            "analytics; and",
            "other services required to operate the Platform.",
          ],
        },
        {
          text: [
            "Service providers will only be given access to information reasonably necessary to perform their functions and should be subject to appropriate confidentiality, security and data-protection requirements.",
            "Information may also be disclosed where:",
          ],
          bullets: [
            "required by law;",
            "required by a valid court order;",
            "requested by an authorised regulatory or law-enforcement authority;",
            "necessary to investigate fraud or unlawful conduct; or",
            "necessary to protect legitimate legal rights.",
          ],
        },
      ],
    },
    {
      id: "no-selling",
      number: "13",
      heading: "WE DO NOT SELL PERSONAL INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach does not sell, rent or trade learner or User personal information to third parties for their independent marketing purposes.",
            "Learner test results and progress information will not be sold to advertisers.",
          ],
        },
      ],
    },
    {
      id: "direct-marketing",
      number: "14",
      heading: "DIRECT MARKETING",
      blocks: [
        {
          text: [
            "K53 Coach may communicate with Users regarding their accounts, purchases, security, Platform updates and educational services.",
            "Where K53 Coach sends electronic direct marketing, it will do so in accordance with applicable South African law.",
            "Where consent is legally required, marketing communications will only be sent after obtaining the appropriate consent.",
            "Users will be provided with a reasonable method of opting out of marketing communications.",
            "Opting out of marketing does not prevent K53 Coach from sending essential transactional, account, security or service-related communications.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      number: "15",
      heading: "COOKIES",
      blocks: [
        {
          text: [
            "The K53 Coach Website may use cookies and similar technologies.",
            "Cookies may be used to:",
          ],
          bullets: [
            "keep Users logged in;",
            "remember preferences;",
            "maintain Platform security;",
            "understand Website usage;",
            "improve performance;",
            "detect fraudulent activity; and",
            "provide essential Website functionality.",
          ],
        },
        {
          text: [
            "Where required, Users will be provided with appropriate information and choices regarding non-essential cookies.",
            "Users may also control certain cookies through their browser settings, although disabling essential cookies may affect Platform functionality.",
          ],
        },
      ],
    },
    {
      id: "security",
      number: "16",
      heading: "DATA SECURITY",
      blocks: [
        {
          text: [
            "K53 Coach will take appropriate and reasonable technical and organisational measures to protect personal information against:",
          ],
          bullets: [
            "loss;",
            "damage;",
            "unauthorised destruction;",
            "unlawful access;",
            "unauthorised disclosure;",
            "alteration; and",
            "unlawful processing.",
          ],
        },
        {
          text: ["Security measures may include, where appropriate:"],
          bullets: [
            "password protection;",
            "encryption;",
            "secure hosting;",
            "access controls;",
            "authentication procedures;",
            "system monitoring;",
            "software updates;",
            "backups; and",
            "restricting access to authorised persons.",
          ],
        },
        {
          text: [
            "No internet-based system can guarantee absolute security, but K53 Coach will take reasonable measures appropriate to the nature of the information being processed.",
          ],
        },
      ],
    },
    {
      id: "breaches",
      number: "17",
      heading: "SECURITY COMPROMISES AND DATA BREACHES",
      blocks: [
        {
          text: [
            "If K53 Coach has reasonable grounds to believe that personal information has been accessed or acquired by an unauthorised person, K53 Coach will investigate the incident and take appropriate steps in accordance with POPIA.",
            "Where legally required, K53 Coach will notify the Information Regulator and affected data subjects as soon as reasonably possible, subject to lawful restrictions on such notification.",
          ],
        },
      ],
    },
    {
      id: "retention",
      number: "18",
      heading: "DATA RETENTION",
      blocks: [
        {
          text: [
            "K53 Coach retains personal information only for as long as reasonably necessary for the purpose for which it was collected or subsequently lawfully processed.",
            "Information may be retained for longer where:",
          ],
          bullets: [
            "required by law;",
            "reasonably necessary for contractual or business records;",
            "required for dispute resolution;",
            "required for fraud prevention;",
            "necessary for legal proceedings; or",
            "the User has consented to longer retention.",
          ],
        },
        {
          text: [
            "When personal information is no longer required and there is no lawful reason to retain it, K53 Coach will delete, destroy or de-identify it in an appropriate manner.",
          ],
        },
      ],
    },
    {
      id: "account-closure",
      number: "19",
      heading: "ACCOUNT CLOSURE",
      blocks: [
        {
          text: [
            "Users may request closure of their K53 Coach account.",
            "Closing an account does not necessarily mean that every record can immediately be deleted.",
            "Certain information may need to be retained where required by law, for financial records, dispute resolution, security, fraud prevention or other lawful purposes.",
            "Information that is no longer lawfully required will be deleted, destroyed or de-identified in accordance with K53 Coach’s retention procedures.",
          ],
        },
      ],
    },
    {
      id: "accuracy",
      number: "20",
      heading: "ACCURACY OF INFORMATION",
      blocks: [
        {
          text: [
            "K53 Coach will take reasonably practicable steps to ensure that personal information is complete, accurate and not misleading where necessary for the purpose for which it is processed.",
            "Users should keep their account and contact information up to date.",
            "Users may contact K53 Coach if they believe information held about them is incorrect.",
          ],
        },
      ],
    },
    {
      id: "popia-rights",
      number: "21",
      heading: "USER RIGHTS UNDER POPIA",
      blocks: [
        {
          text: [
            "Subject to POPIA and other applicable laws, a data subject may have the right to:",
          ],
          bullets: [
            "ask whether K53 Coach holds personal information about them;",
            "request access to their personal information;",
            "request correction of inaccurate or incomplete information;",
            "request deletion or destruction of personal information where legally applicable;",
            "object to certain processing;",
            "withdraw consent where processing is based on consent;",
            "object to certain direct marketing;",
            "request information about third parties who have had access to their information where applicable; and",
            "lodge a complaint with the Information Regulator.",
          ],
        },
        {
          text: ["Some rights are subject to legal limitations and exceptions."],
        },
      ],
    },
    {
      id: "access-requests",
      number: "22",
      heading: "ACCESS, CORRECTION OR DELETION REQUESTS",
      blocks: [
        {
          text: ["Users wishing to exercise their privacy rights may contact:"],
          lines: [`Email: ${OPERATOR.email}`, `Telephone: ${OPERATOR.phone}`],
        },
        {
          text: [
            "The request should clearly explain what information or action is being requested.",
            "K53 Coach may require reasonable proof of identity before providing access to, correcting or deleting personal information.",
            "This protects Users against unauthorised disclosure of their information.",
          ],
        },
      ],
    },
    {
      id: "children-requests",
      number: "23",
      heading: "INFORMATION ABOUT CHILDREN",
      blocks: [
        {
          text: [
            "Where a parent or guardian submits a request concerning a child’s information, K53 Coach may require reasonable evidence confirming that the person is legally authorised to act on behalf of the child.",
            "This requirement is intended to protect the child’s privacy and personal information.",
          ],
        },
      ],
    },
    {
      id: "cross-border",
      number: "24",
      heading: "CROSS-BORDER DATA TRANSFERS",
      blocks: [
        {
          text: [
            "Some technology, hosting, cloud, software or service providers used by K53 Coach may process or store information outside South Africa.",
            "Where personal information is transferred outside South Africa, K53 Coach will take reasonable steps to ensure that the transfer complies with POPIA’s requirements concerning trans-border information flows.",
            "This may include ensuring that appropriate legal protections, contractual safeguards, consent or another lawful basis applies.",
          ],
        },
      ],
    },
    {
      id: "third-party-services",
      number: "25",
      heading: "THIRD-PARTY SERVICES",
      blocks: [
        {
          text: [
            "The Platform may use or link to services operated by third parties, such as payment processors or other technology providers.",
            "Those third parties may have their own privacy policies and legal obligations.",
            "K53 Coach encourages Users to review the privacy practices of third-party services where personal information is supplied directly to them.",
          ],
        },
      ],
    },
    {
      id: "external-links",
      number: "26",
      heading: "LINKS TO OTHER WEBSITES",
      blocks: [
        {
          text: [
            "The K53 Coach Website may contain links to external websites.",
            "K53 Coach is not responsible for the privacy practices or content of independent third-party websites merely because a link appears on the Platform.",
            "Users should review the privacy policy of the relevant third-party website.",
          ],
        },
      ],
    },
    {
      id: "information-officer",
      number: "27",
      heading: "INFORMATION OFFICER",
      blocks: [
        {
          text: [
            "K53 Coach will maintain an Information Officer as required by applicable South African law.",
          ],
          lines: [
            `Information Officer: ${OPERATOR.informationOfficer}`,
            `Email: ${OPERATOR.email}`,
            `Telephone: ${OPERATOR.phone}`,
          ],
        },
        {
          text: [
            "Privacy and POPIA-related requests may be directed to the Information Officer.",
          ],
        },
      ],
    },
    {
      id: "information-regulator",
      number: "28",
      heading: "INFORMATION REGULATOR",
      blocks: [
        {
          text: [
            "A User who believes that their personal information has been processed unlawfully has the right to raise the matter with K53 Coach.",
            "Users may also lodge a complaint with the Information Regulator (South Africa) in accordance with POPIA.",
            "Current official contact information and complaint procedures can be obtained from the Information Regulator.",
          ],
        },
      ],
    },
    {
      id: "policy-changes",
      number: "29",
      heading: "CHANGES TO THIS PRIVACY POLICY",
      blocks: [
        {
          text: ["K53 Coach may update this Privacy Policy when necessary because of:"],
          bullets: [
            "changes to the Platform;",
            "changes in technology;",
            "changes to our information-processing activities;",
            "regulatory guidance; or",
            "changes in applicable law.",
          ],
        },
        {
          text: [
            `The current version will be published on ${OPERATOR.website}.`,
            "Where a change materially affects how Users’ personal information is processed, K53 Coach will take reasonable steps to notify affected Users where appropriate.",
          ],
        },
      ],
    },
    {
      id: "contact",
      number: "30",
      heading: "CONTACT US",
      blocks: [
        {
          text: [
            "Questions, complaints or requests relating to privacy or personal information may be directed to:",
          ],
        },
        CONTACT_BLOCK,
      ],
    },
  ],

  /**
   * Clauses added after the document was supplied. Not part of the verbatim
   * comparison — see the note at the top of this file and docs/legal/README.md.
   */
  amendments: [
    {
      id: "ai-coach-chat",
      number: "31",
      heading: "AI COACH AND CHAT (ASK COACH)",
      amendment: {
        addedOn: "2026-08-07",
        addedBy: "John (K53 Coach)",
        reason:
          "Ask Coach shipped after this policy was supplied. It is the first feature that accepts free-text from a User and sends it to a third-party AI provider, and clauses 4, 12 and 24 do not describe it. Published now rather than held for the next policy revision; to be reviewed with the business when the beta ends.",
      },
      blocks: [
        {
          text: [
            "This clause was added by K53 Coach on 7 August 2026 and describes a feature released after the effective date above. It supplements, and does not replace, the clauses that precede it.",
          ],
        },
        {
          subheading: "31.1 What Ask Coach is",
          text: [
            "Ask Coach is an optional feature available to Users with paid access. It answers questions about road signs, rules of the road, vehicle controls and the learner’s licence test using K53 Coach’s own verified learning content. It is not a general-purpose assistant and does not answer questions outside that subject matter.",
          ],
        },
        {
          subheading: "31.2 What we collect",
          text: [
            "When a User sends a question to Ask Coach, K53 Coach stores the question, the answer given, and which learning content that answer was based on, linked to the User’s account. This forms part of the User’s learning record as described in clause 10 (Learning Progress and Analytics).",
          ],
        },
        {
          subheading: "31.3 Processing by a third-party AI provider",
          text: [
            "To generate an answer, the question and the relevant extracts of K53 Coach’s learning content are sent to a third-party artificial-intelligence service provider, which may process them outside South Africa. This processing is subject to clause 24 (Cross-Border Data Transfers) and clause 25 (Third-Party Services). No account, contact, payment or identity information is sent to that provider.",
          ],
        },
        {
          subheading: "31.4 Automated removal of identifiers",
          text: [
            "Before a question leaves the Platform, K53 Coach automatically detects and removes South African identity numbers, telephone numbers and email addresses from the text. The version stored on the Platform is the version with those identifiers removed. This is an automated safeguard and not a guarantee: Users should not include personal information, their own or anyone else’s, in a question.",
          ],
        },
        {
          subheading: "31.5 Retention and deletion",
          text: [
            "A User may delete any Ask Coach conversation at any time from within the Platform, which deletes the questions and answers it contains. Where Ask Coach was unable to answer a question, K53 Coach keeps a record of that fact in order to identify gaps in its learning content, and automatically clears the text of the question after 30 days. Clause 18 (Data Retention) otherwise applies.",
          ],
        },
        {
          subheading: "31.6 Limits of the feature",
          text: [
            "Ask Coach answers only from K53 Coach’s verified learning content and does not search the internet. It does not provide legal advice, and it does not assess or certify whether a User is ready to sit the official learner’s licence test. Clause 11 (Automated Processing) applies: no decision affecting a User is taken solely by automated means.",
          ],
        },
      ],
    },
  ],

  callout: {
    title: "PRIVACY SUMMARY",
    blocks: [
      {
        subheading: "What do we collect?",
        text: [
          "Primarily account/contact information, test results, learning progress, transaction information and technical information required to operate K53 Coach.",
        ],
      },
      {
        subheading: "Why do we collect it?",
        text: [
          "To provide the K53 Coach educational service, administer accounts, process payments, track learning progress, provide educational feedback, secure the Platform and meet legal obligations.",
        ],
      },
      {
        subheading: "Do we sell learner information?",
        text: ["No."],
      },
      {
        subheading: "How long do we keep information?",
        text: [
          "Only for as long as reasonably necessary or as otherwise required or permitted by law.",
        ],
      },
      {
        subheading: "Can Users request access or correction?",
        text: ["Yes, subject to POPIA and applicable legal requirements."],
      },
      {
        subheading: "How do we protect children’s information?",
        text: [
          "Children’s personal information receives additional protection, including appropriate parental/guardian or competent-person consent where required by law.",
        ],
      },
      {
        subheading: "Privacy Contact:",
        lines: [OPERATOR.email, OPERATOR.phone],
      },
    ],
  },
};
