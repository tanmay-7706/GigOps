// POST /api/approve-action/:feedbackId
// Body: { approvedMessage: string } — the manager-approved (possibly edited)
// customer message. Marks the feedback "actioned", applies the drafted quality
// score adjustment to the professional, and recalculates their status.

import { getFeedbackById, updateFeedback } from "@/lib/lemma/documentStore";
import { getProfessionalById, updateProfessional } from "@/lib/lemma/datastore";
import { recalculateQualityScore } from "@/lib/lemma/functions/qualityScore";
import { ok, fail } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;

    let approvedMessage = "";
    try {
      const body = await req.json();
      approvedMessage = typeof body?.approvedMessage === "string" ? body.approvedMessage : "";
    } catch {
      /* empty/invalid body — approvedMessage stays "" */
    }

    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
      return fail(`Feedback ${feedbackId} not found`, 404);
    }
    if (!feedback.actionDraft || !feedback.triageResult) {
      return fail(`Feedback ${feedbackId} has not been triaged yet`, 409);
    }

    const professional = await getProfessionalById(feedback.professionalId);
    if (!professional) {
      return fail(`Professional ${feedback.professionalId} not found`, 404);
    }

    // Apply the quality-score adjustment and recompute status.
    const { updatedScore, updatedStatus } = recalculateQualityScore(
      professional.qualityScore,
      professional.status,
      feedback.actionDraft.qualityScoreAdjustment
    );
    await updateProfessional(professional.id, {
      qualityScore: updatedScore,
      status: updatedStatus,
    });

    // Mark the feedback actioned and record the approved message.
    await updateFeedback(feedbackId, {
      status: "actioned",
      approvedMessage: approvedMessage || feedback.actionDraft.escalationMessage,
    });

    return ok({ success: true, updatedScore, updatedStatus });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to approve action");
  }
}
