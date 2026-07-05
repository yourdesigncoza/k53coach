import type { ExamPaper } from "@/lib/exam";

/**
 * In-progress mock-exam draft, device-local. A 60-minute exam is too expensive to
 * lose to an accidental refresh, so the assembled paper + answers + start time
 * live in localStorage while the sitting is underway. Cleared on submit or when
 * the deadline has passed. (Answers are inspectable in devtools — acceptable, as
 * approved questions' correct answers are already public via RLS app-wide.)
 */
export const EXAM_DRAFT_KEY = "k53.exam.draft";

export interface ExamDraft {
  paper: ExamPaper;
  answers: Record<string, number>;
  index: number;
  startedAt: string; // ISO
  timerEnabled: boolean;
}

export function saveExamDraft(draft: ExamDraft): void {
  try {
    localStorage.setItem(EXAM_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private mode / quota — degrade gracefully (exam still runs in memory).
  }
}

export function loadExamDraft(): ExamDraft | null {
  try {
    const raw = localStorage.getItem(EXAM_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ExamDraft) : null;
  } catch {
    return null;
  }
}

export function clearExamDraft(): void {
  try {
    localStorage.removeItem(EXAM_DRAFT_KEY);
  } catch {
    // ignore
  }
}
