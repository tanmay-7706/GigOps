// lib/lemma/datastore.ts
// "Lemma Datastore" — service professional profiles, backed by the `professionals`
// table in the Lemma pod (via the REST client).

import type { ServiceProfessional, ProfessionalStatus } from "@/types";
import { listRecords, updateRecord, type LemmaRecord } from "./lemmaRest";

const TABLE = "professionals";

function toProfessional(r: LemmaRecord): ServiceProfessional {
  return {
    id: String(r.key),
    name: String(r.name ?? ""),
    city: String(r.city ?? ""),
    serviceTypes: Array.isArray(r.service_types) ? (r.service_types as string[]) : [],
    qualityScore: Number(r.quality_score ?? 0),
    totalBookings: Number(r.total_bookings ?? 0),
    activeComplaints: Number(r.active_complaints ?? 0),
    status: (r.status as ProfessionalStatus) ?? "active",
    joinedDate: String(r.joined_date ?? ""),
    lastServiceDate: String(r.last_service_date ?? ""),
  };
}

export async function getAllProfessionals(): Promise<ServiceProfessional[]> {
  const rows = await listRecords(TABLE);
  return rows.map(toProfessional);
}

export async function getProfessionalById(id: string): Promise<ServiceProfessional | null> {
  const rows = await listRecords(TABLE);
  const r = rows.find((x) => x.key === id);
  return r ? toProfessional(r) : null;
}

/** Update a professional by business key; patch uses app field names. */
export async function updateProfessional(
  id: string,
  patch: Partial<ServiceProfessional>
): Promise<ServiceProfessional | null> {
  const rows = await listRecords(TABLE);
  const r = rows.find((x) => x.key === id);
  if (!r) return null;

  const fields: Record<string, unknown> = {};
  if (patch.qualityScore !== undefined) fields.quality_score = patch.qualityScore;
  if (patch.activeComplaints !== undefined) fields.active_complaints = patch.activeComplaints;
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.totalBookings !== undefined) fields.total_bookings = patch.totalBookings;
  if (Object.keys(fields).length) await updateRecord(TABLE, r.id, fields);

  return { ...toProfessional(r), ...patch };
}
