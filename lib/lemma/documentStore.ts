// lib/lemma/documentStore.ts
// -----------------------------------------------------------------------------
// "Lemma Document Store" operations — CRUD over Customer Feedback documents.
// Backed by the seeded store (store.ts). Every write persists to disk.
// -----------------------------------------------------------------------------

import type { CustomerFeedback, FeedbackStatus } from "@/types";
import { getStore, persist } from "./store";

/** All feedback documents (unsorted). */
export async function getAllFeedback(): Promise<CustomerFeedback[]> {
  const store = await getStore();
  return store.feedback;
}

/** Feedback filtered by status. */
export async function getFeedbackByStatus(
  status: FeedbackStatus
): Promise<CustomerFeedback[]> {
  const store = await getStore();
  return store.feedback.filter((f) => f.status === status);
}

/** Single feedback document by id, or null if not found. */
export async function getFeedbackById(
  id: string
): Promise<CustomerFeedback | null> {
  const store = await getStore();
  return store.feedback.find((f) => f.id === id) ?? null;
}

/** All feedback for one professional. */
export async function getFeedbackForProfessional(
  professionalId: string
): Promise<CustomerFeedback[]> {
  const store = await getStore();
  return store.feedback.filter((f) => f.professionalId === professionalId);
}

/**
 * Apply a partial update to a feedback document and persist. Returns the
 * updated document, or null if the id doesn't exist.
 */
export async function updateFeedback(
  id: string,
  patch: Partial<CustomerFeedback>
): Promise<CustomerFeedback | null> {
  const store = await getStore();
  const doc = store.feedback.find((f) => f.id === id);
  if (!doc) return null;
  Object.assign(doc, patch);
  await persist();
  return doc;
}
