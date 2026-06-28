// lib/lemma/functions/qualityScore.ts
// -----------------------------------------------------------------------------
// Quality-score recalculation Function.
//
// Pure logic: given a professional's current score/status and a delta, compute
// the new score (clamped 0.0–5.0, one decimal) and the resulting status per the
// platform's thresholds. Used by POST /api/approve-action.
//
// Status thresholds:
//   score < 3.0   -> "under-review"
//   score < 3.8   -> "flagged"
//   score >= 3.8  -> "active"   (only an UPGRADE from "flagged" — a professional
//                                already "under-review" stays under review, and
//                                "deactivated" is terminal)
// -----------------------------------------------------------------------------

import type { ProfessionalStatus } from "@/types";

export interface QualityScoreResult {
  updatedScore: number;
  updatedStatus: ProfessionalStatus;
}

/** Round to one decimal place and clamp into the 0.0–5.0 range. */
export function clampScore(score: number): number {
  const rounded = Math.round(score * 10) / 10;
  return Math.min(5, Math.max(0, rounded));
}

/**
 * Recalculate a professional's quality score and status after applying a
 * score adjustment (e.g. -0.4 for a CRITICAL complaint, +0.1 for praise).
 */
export function recalculateQualityScore(
  currentScore: number,
  currentStatus: ProfessionalStatus,
  adjustment: number
): QualityScoreResult {
  const updatedScore = clampScore(currentScore + adjustment);

  // Deactivated is a terminal, manually-set state — never auto-change it.
  if (currentStatus === "deactivated") {
    return { updatedScore, updatedStatus: "deactivated" };
  }

  let updatedStatus: ProfessionalStatus;
  if (updatedScore < 3.0) {
    updatedStatus = "under-review";
  } else if (updatedScore < 3.8) {
    updatedStatus = "flagged";
  } else {
    // score >= 3.8: only upgrade to active from flagged/active, not from under-review.
    updatedStatus = currentStatus === "under-review" ? "under-review" : "active";
  }

  return { updatedScore, updatedStatus };
}
