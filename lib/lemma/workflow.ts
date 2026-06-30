// lib/lemma/workflow.ts
// gigops-triage-workflow — runs the Lemma triage + action agents over every
// pending feedback row in the Lemma pod, writes the results back to the feedback
// table, and updates each professional's complaint count + flag status.
//
// Orchestration lives here (the app driving Lemma agents directly is the
// idiomatic pattern — Lemma functions are reserved for deterministic work).
// One feedback failing never kills the run.

import type { TriageResult, ActionDraft, WorkflowResult } from "@/types";
import { listRecords, updateRecord } from "./lemmaRest";
import { runTriageAgent } from "./agents/triageAgent";
import { runActionAgent } from "./agents/actionAgent";

const CONCURRENCY = 4;

export async function runTriageWorkflow(): Promise<WorkflowResult> {
  const [feedback, professionals] = await Promise.all([
    listRecords("feedback"),
    listRecords("professionals"),
  ]);
  const pending = feedback.filter((f) => f.status === "pending");
  console.log(`[lemma:workflow] processing ${pending.length} pending feedback rows`);

  const results: TriageResult[] = [];
  const failed: { feedbackId: string; error: string }[] = [];
  // Aggregate per-professional changes so parallel feedback never races on the
  // same professional row.
  const proDeltas = new Map<string, { complaints: number; critical: boolean }>();

  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const f = pending[cursor++];
      const fkey = String(f.key);
      try {
        const triageOut = await runTriageAgent({
          feedbackText: String(f.feedback_text),
          professionalName: String(f.professional_name),
          serviceType: String(f.service_type),
        });
        const severity = triageOut.severity;

        const triageResult: TriageResult = {
          feedbackId: fkey,
          professionalId: String(f.professional_key),
          severity,
          issueType: triageOut.issueType,
          keyDetails: triageOut.keyDetails,
          confidence: triageOut.confidence,
          recommendedAction: triageOut.recommendedAction,
          processedAt: new Date().toISOString(),
        };

        const actionOut = await runActionAgent({
          severity,
          issueType: triageOut.issueType,
          keyDetails: triageOut.keyDetails,
          professionalName: String(f.professional_name),
          customerName: String(f.customer_name),
        });
        const actionDraft: ActionDraft = {
          feedbackId: fkey,
          actionType: actionOut.actionType,
          escalationMessage: actionOut.escalationMessage,
          internalNote: actionOut.internalNote,
          qualityScoreAdjustment: actionOut.qualityScoreAdjustment,
          createdAt: new Date().toISOString(),
        };

        await updateRecord("feedback", f.id, {
          status: "triaged",
          severity,
          triage_result: triageResult,
          action_draft: actionDraft,
        });

        const pk = String(f.professional_key);
        const d = proDeltas.get(pk) ?? { complaints: 0, critical: false };
        if (severity === "CRITICAL" || severity === "WARNING") d.complaints += 1;
        if (severity === "CRITICAL") d.critical = true;
        proDeltas.set(pk, d);

        results.push(triageResult);
        console.log(`[lemma:workflow] ✓ ${fkey} -> ${severity} (${actionDraft.actionType})`);
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        failed.push({ feedbackId: fkey, error });
        console.error(`[lemma:workflow] ✗ ${fkey}: ${error}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pending.length || 1) }, worker)
  );

  // Apply aggregated professional updates sequentially (safe, no races).
  const proByKey = new Map(professionals.map((p) => [String(p.key), p]));
  for (const [pk, d] of proDeltas) {
    const p = proByKey.get(pk);
    if (!p) continue;
    const fields: Record<string, unknown> = {};
    if (d.complaints > 0) {
      fields.active_complaints = Number(p.active_complaints ?? 0) + d.complaints;
    }
    if (d.critical && p.status !== "under-review" && p.status !== "deactivated") {
      fields.status = "flagged";
    }
    if (Object.keys(fields).length) await updateRecord("professionals", String(p.id), fields);
  }

  console.log(`[lemma:workflow] done — processed ${results.length}, failed ${failed.length}`);
  return { processed: results.length, results, failed };
}
