// GET /api/professionals/:id — one professional plus their full feedback history.

import { getProfessionalById } from "@/lib/lemma/datastore";
import { getFeedbackForProfessional } from "@/lib/lemma/documentStore";
import { ok, fail } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const professional = await getProfessionalById(id);
    if (!professional) {
      return fail(`Professional ${id} not found`, 404);
    }
    const feedbackHistory = await getFeedbackForProfessional(id);
    // Shape matches lib/api.ts: ServiceProfessional & { feedbackHistory }.
    return ok({ ...professional, feedbackHistory });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch professional");
  }
}
