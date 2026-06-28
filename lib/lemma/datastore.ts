// lib/lemma/datastore.ts
// -----------------------------------------------------------------------------
// "Lemma Datastore" operations — CRUD over Service Professional profiles.
// Backed by the seeded store (store.ts). Every write persists to disk.
// -----------------------------------------------------------------------------

import type { ServiceProfessional } from "@/types";
import { getStore, persist } from "./store";

/** All professionals (unsorted). */
export async function getAllProfessionals(): Promise<ServiceProfessional[]> {
  const store = await getStore();
  return store.professionals;
}

/** Single professional by id, or null if not found. */
export async function getProfessionalById(
  id: string
): Promise<ServiceProfessional | null> {
  const store = await getStore();
  return store.professionals.find((p) => p.id === id) ?? null;
}

/**
 * Apply a partial update to a professional and persist. Returns the updated
 * record, or null if the id doesn't exist.
 */
export async function updateProfessional(
  id: string,
  patch: Partial<ServiceProfessional>
): Promise<ServiceProfessional | null> {
  const store = await getStore();
  const prof = store.professionals.find((p) => p.id === id);
  if (!prof) return null;
  Object.assign(prof, patch);
  await persist();
  return prof;
}
