// POST /api/run-triage-workflow — run the Lemma-traced triage workflow over all
// pending feedback. Returns { processed, results, failed }.

import { runTriageWorkflow } from "@/lib/lemma/workflow";
import { ok, fail } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";
// The workflow makes ~2 LLM calls per pending feedback; give it room.
export const maxDuration = 120;

export async function POST() {
  try {
    const result = await runTriageWorkflow();
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Triage workflow failed");
  }
}
