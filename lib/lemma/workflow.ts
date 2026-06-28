// lib/lemma/workflow.ts
// -----------------------------------------------------------------------------
// gigops-triage-workflow — orchestrates the Triage Agent and Action Agent over
// every pending feedback document, updates the stores, and is fully traced
// through Lemma (observability). One failed feedback never kills the run.
//
// Steps per the spec:
//   1. FETCH all "pending" feedback.
//   2. FOR EACH:
//      a. Triage Agent  -> TriageResult
//      b. Action Agent  -> ActionDraft
//      c. Attach both to the feedback doc; set status = "triaged".
//      d. Update the professional: activeComplaints += 1 (CRITICAL/WARNING),
//         and flag them on CRITICAL (unless already under-review/deactivated).
//   3. RETURN { processed, results, failed }.
// -----------------------------------------------------------------------------

import type { TriageResult, ActionDraft, WorkflowResult } from "@/types";
import { withWorkflowTrace, withSpan } from "./config";
import { getFeedbackByStatus, updateFeedback } from "./documentStore";
import { getProfessionalById, updateProfessional } from "./datastore";
import { runTriageAgent } from "./agents/triageAgent";
import { runActionAgent } from "./agents/actionAgent";

export async function runTriageWorkflow(): Promise<WorkflowResult> {
  return withWorkflowTrace("gigops-triage-workflow", {}, async (trace) => {
    const pending = await withSpan(
      trace,
      "fetch-pending-feedback",
      {},
      () => getFeedbackByStatus("pending")
    );

    console.log(`[workflow] processing ${pending.length} pending feedback entries`);

    const results: TriageResult[] = [];
    const failed: { feedbackId: string; error: string }[] = [];

    for (const feedback of pending) {
      try {
        // a. Triage Agent
        const triageOut = await withSpan(
          trace,
          "triage-agent",
          { "feedback.id": feedback.id, "professional.id": feedback.professionalId },
          () =>
            runTriageAgent({
              feedbackText: feedback.feedbackText,
              professionalName: feedback.professionalName,
              serviceType: feedback.serviceType,
            })
        );

        const triageResult: TriageResult = {
          feedbackId: feedback.id,
          professionalId: feedback.professionalId,
          severity: triageOut.severity,
          issueType: triageOut.issueType,
          keyDetails: triageOut.keyDetails,
          confidence: triageOut.confidence,
          recommendedAction: triageOut.recommendedAction,
          processedAt: new Date().toISOString(),
        };

        // b. Action Agent
        const actionOut = await withSpan(
          trace,
          "action-agent",
          { "feedback.id": feedback.id, severity: triageResult.severity },
          () =>
            runActionAgent({
              severity: triageResult.severity,
              issueType: triageResult.issueType,
              keyDetails: triageResult.keyDetails,
              professionalName: feedback.professionalName,
              customerName: feedback.customerName,
            })
        );

        const actionDraft: ActionDraft = {
          feedbackId: feedback.id,
          actionType: actionOut.actionType,
          escalationMessage: actionOut.escalationMessage,
          internalNote: actionOut.internalNote,
          qualityScoreAdjustment: actionOut.qualityScoreAdjustment,
          createdAt: new Date().toISOString(),
        };

        // c. Attach results to the feedback document; mark triaged.
        await withSpan(
          trace,
          "update-feedback-document",
          { "feedback.id": feedback.id },
          () =>
            updateFeedback(feedback.id, {
              triageResult,
              actionDraft,
              status: "triaged",
            })
        );

        // d. Update the professional profile.
        await withSpan(
          trace,
          "update-professional-profile",
          { "professional.id": feedback.professionalId, severity: triageResult.severity },
          async () => {
            const prof = await getProfessionalById(feedback.professionalId);
            if (!prof) return;

            const isComplaint =
              triageResult.severity === "CRITICAL" || triageResult.severity === "WARNING";
            const patch: Partial<typeof prof> = {};

            if (isComplaint) {
              patch.activeComplaints = prof.activeComplaints + 1;
            }
            // CRITICAL flags the professional, unless they're already in a more
            // serious state (under-review) or deactivated.
            if (
              triageResult.severity === "CRITICAL" &&
              prof.status !== "under-review" &&
              prof.status !== "deactivated"
            ) {
              patch.status = "flagged";
            }

            if (Object.keys(patch).length > 0) {
              await updateProfessional(feedback.professionalId, patch);
            }
          }
        );

        results.push(triageResult);
        console.log(
          `[workflow] ✓ ${feedback.id} -> ${triageResult.severity} (${actionDraft.actionType})`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[workflow] ✗ ${feedback.id} failed: ${message}`);
        failed.push({ feedbackId: feedback.id, error: message });
        // Continue with the rest — one failure must not kill the workflow.
      }
    }

    console.log(
      `[workflow] done — processed ${results.length}, failed ${failed.length}`
    );

    return { processed: results.length, results, failed };
  });
}
