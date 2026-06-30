// lib/lemma/documentStore.ts
// "Lemma Document Store" — customer feedback, backed by the `feedback` table in
// the Lemma pod (via the REST client). Triage/action results live in JSON columns.

import type { CustomerFeedback, FeedbackStatus, TriageResult, ActionDraft } from "@/types";
import { listRecords, updateRecord, type LemmaRecord } from "./lemmaRest";

const TABLE = "feedback";

function toFeedback(r: LemmaRecord): CustomerFeedback {
  return {
    id: String(r.key),
    professionalId: String(r.professional_key),
    professionalName: String(r.professional_name ?? ""),
    customerName: String(r.customer_name ?? ""),
    serviceType: String(r.service_type ?? ""),
    bookingDate: String(r.booking_date ?? ""),
    feedbackText: String(r.feedback_text ?? ""),
    submittedAt: String(r.submitted_at ?? ""),
    status: (r.status as FeedbackStatus) ?? "pending",
    triageResult: (r.triage_result as TriageResult) ?? undefined,
    actionDraft: (r.action_draft as ActionDraft) ?? undefined,
    approvedMessage: (r.approved_message as string) ?? undefined,
  };
}

export async function getAllFeedback(): Promise<CustomerFeedback[]> {
  const rows = await listRecords(TABLE);
  return rows.map(toFeedback);
}

export async function getFeedbackByStatus(status: FeedbackStatus): Promise<CustomerFeedback[]> {
  const rows = await listRecords(TABLE);
  return rows.map(toFeedback).filter((f) => f.status === status);
}

export async function getFeedbackById(id: string): Promise<CustomerFeedback | null> {
  const rows = await listRecords(TABLE);
  const r = rows.find((x) => x.key === id);
  return r ? toFeedback(r) : null;
}

export async function getFeedbackForProfessional(professionalId: string): Promise<CustomerFeedback[]> {
  const rows = await listRecords(TABLE);
  return rows.map(toFeedback).filter((f) => f.professionalId === professionalId);
}

/** Update a feedback document by business key; patch uses app field names. */
export async function updateFeedback(
  id: string,
  patch: Partial<CustomerFeedback>
): Promise<CustomerFeedback | null> {
  const rows = await listRecords(TABLE);
  const r = rows.find((x) => x.key === id);
  if (!r) return null;

  const fields: Record<string, unknown> = {};
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.approvedMessage !== undefined) fields.approved_message = patch.approvedMessage;
  if (patch.triageResult !== undefined) {
    fields.triage_result = patch.triageResult;
    fields.severity = patch.triageResult.severity;
  }
  if (patch.actionDraft !== undefined) fields.action_draft = patch.actionDraft;
  if (Object.keys(fields).length) await updateRecord(TABLE, r.id, fields);

  return { ...toFeedback(r), ...patch };
}
