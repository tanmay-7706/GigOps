// GET /api/dashboard/stats — aggregate stats for the Team Health Board.

import { getAllProfessionals } from "@/lib/lemma/datastore";
import { getAllFeedback } from "@/lib/lemma/documentStore";
import { ok, fail } from "@/lib/apiResponse";
import type { DashboardStats } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [professionals, feedback] = await Promise.all([
      getAllProfessionals(),
      getAllFeedback(),
    ]);

    const totalProfessionals = professionals.length;
    const pendingFeedbacks = feedback.filter((f) => f.status === "pending").length;
    const activeEscalations = feedback.filter(
      (f) => f.status === "triaged" && f.triageResult?.severity === "CRITICAL"
    ).length;
    const avgQualityScore =
      totalProfessionals === 0
        ? 0
        : Math.round(
            (professionals.reduce((sum, p) => sum + p.qualityScore, 0) /
              totalProfessionals) *
              10
          ) / 10;

    const stats: DashboardStats = {
      totalProfessionals,
      pendingFeedbacks,
      activeEscalations,
      avgQualityScore,
    };
    return ok(stats);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to compute dashboard stats");
  }
}
