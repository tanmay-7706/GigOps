// GET /api/feedback/:id — one feedback document, including triageResult and
// actionDraft if they have been attached by the workflow.

import { getFeedbackById } from "@/lib/lemma/documentStore";
import { ok, fail } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedback = await getFeedbackById(id);
    if (!feedback) {
      return fail(`Feedback ${id} not found`, 404);
    }
    return ok(feedback);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch feedback");
  }
}
