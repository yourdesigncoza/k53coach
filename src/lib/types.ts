/**
 * Domain types for K53 Coach.
 * These mirror the logical "Databases" in the PRD (DB1 signs, DB4 questions,
 * DB9 readiness scoring) but are plain TS — the Supabase schema can adopt the
 * same shapes once a POPIA review clears production data storage.
 */

export type SignCategory =
  | "regulatory"
  | "warning"
  | "guidance"
  | "marking";

/**
 * Per-asset licence + provenance record (REQUIRED for every sign SVG).
 *
 * SA/SADC official road signs on Wikimedia Commons are generally Public Domain
 * under SA Copyright Act §12(8)(a) (no copyright in official texts of a
 * legislative/administrative nature). BUT Commons licences are per-file — every
 * SVG must be licence-audited individually and verified against the official
 * Department of Transport chart (RTSigns_charts.pdf) before it ships.
 */
export interface AssetProvenance {
  /** Local filename in /public/signs once normalised, e.g. "R001-stop.svg". */
  svgFile?: string;
  /** e.g. "Wikimedia Commons", or "original-redraw" for placeholders. */
  source: string;
  sourceUrl?: string;
  /** e.g. "Public Domain / PD-SADC-RTSM". Audited per file. */
  licence: string;
  attributionRequired: boolean;
  /** Official reference we checked the sign against, e.g. "RTSigns_charts.pdf". */
  verifiedAgainst?: string;
  /** Asset-level audit state, distinct from the learning-content review below. */
  assetStatus: "needs_review" | "audited" | "approved";
}

/** DB1 — a road sign as a structured learning object (overview §12.2). */
export interface RoadSign {
  /** Internal reference code (not copied from any manual). */
  code: string;
  name: string;
  category: SignCategory;
  subcategory: string;
  /** Key into the local placeholder glyph library (src/components/signs). */
  glyph: string;
  /** Licence + source audit for the shipping SVG asset. */
  provenance: AssetProvenance;
  /** Short, official-style description — written originally. */
  formalMeaning: string;
  /** Learner-friendly wording. */
  plainEnglish: string;
  /** What the driver must actually do. */
  behaviour: string;
  /** What learners commonly get wrong. */
  commonMistake: string;
  /** How it may appear in the test. */
  testHint: string;
  /** Codes of similar / confusable signs. */
  relatedSigns: string[];
  reviewStatus: "draft" | "reviewed" | "approved";
}

export type RuleCategory =
  | "right-of-way"
  | "following"
  | "overtaking"
  | "intersections"
  | "signals"
  | "speed"
  | "pedestrians"
  | "parking";

/** DB2 — a road rule as a structured learning object, mirroring RoadSign. */
export interface RoadRule {
  code: string;
  title: string;
  category: RuleCategory;
  /** One-line, learner-friendly summary. */
  summary: string;
  /** The formal rule statement (written originally). */
  rule: string;
  /** What the driver must actually do. */
  whatToDo: string;
  commonMistake: string;
  testHint: string;
  relatedRules: string[];
  reviewStatus: "draft" | "reviewed" | "approved";
}

export type ControlCategory =
  | "primary"
  | "transmission"
  | "signals"
  | "instruments"
  | "pre-drive";

/** DB3 — a vehicle control as a structured learning object. */
export interface VehicleControl {
  code: string;
  name: string;
  category: ControlCategory;
  /** One-line, learner-friendly summary. */
  summary: string;
  /** What the control is for. */
  whatItDoes: string;
  /** How to operate it correctly. */
  howToUse: string;
  commonMistake: string;
  testHint: string;
  relatedControls: string[];
  reviewStatus: "draft" | "reviewed" | "approved";
}

export type Topic = "signs" | "rules" | "controls";

/** DB4 — a question with options + the AI-coaching fields (DB5). */
export interface Question {
  id: string;
  topic: Topic;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Short explanation of why the correct answer is right. */
  explanation: string;
  /** Optional pointer to the sign this question is about. */
  signCode?: string;
}

/** Per-topic readiness result. */
export interface TopicScore {
  topic: Topic;
  correct: number;
  total: number;
  /** 0–100. */
  percent: number;
}

export type ReadinessBand = "not-ready" | "almost-ready" | "test-ready";

/** Output of the readiness engine (DB9). */
export interface ReadinessResult {
  overall: number; // 0–100
  band: ReadinessBand;
  byTopic: TopicScore[];
  weakest: Topic | null;
  takenAt: string; // ISO
}
