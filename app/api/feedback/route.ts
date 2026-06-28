// GET /api/feedback[?status=pending|triaged|actioned|resolved]
// All feedback (optionally filtered by status), newest first.

import { getAllFeedback, getFeedbackByStatus } from "@/lib/lemma/documentStore";
import { ok, fail } from "@/lib/apiResponse";
import type { FeedbackStatus } from "@/types";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES: FeedbackStatus[] = ["pending", "triaged", "actioned", "resolved"];

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get("status");

    let feedback;
    if (statusParam) {
      if (!VALID_STATUSES.includes(statusParam as FeedbackStatus)) {
        return fail(`Invalid status filter: ${statusParam}`, 400);
      }
      feedback = await getFeedbackByStatus(statusParam as FeedbackStatus);
    } else {
      feedback = await getAllFeedback();
    }

    const sorted = [...feedback].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    return ok(sorted);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch feedback");
  }
}
