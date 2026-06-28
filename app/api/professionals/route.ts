// GET /api/professionals — all professionals, sorted by quality score ascending
// (lowest / most at-risk first).

import { getAllProfessionals } from "@/lib/lemma/datastore";
import { ok, fail } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const professionals = await getAllProfessionals();
    const sorted = [...professionals].sort((a, b) => a.qualityScore - b.qualityScore);
    return ok(sorted);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch professionals");
  }
}
