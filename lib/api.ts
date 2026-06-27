import type {
  ApiResponse,
  ServiceProfessional,
  CustomerFeedback,
  TriageResult,
  ActionDraft,
  DashboardStats,
  WorkflowResult,
  ApproveActionResult,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    return {
      success: false,
      data: null as unknown as T,
      error: `Request failed with status ${res.status}`,
    };
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// GET /api/professionals — Returns array of all professional profiles
// ---------------------------------------------------------------------------

export async function getProfessionals(): Promise<ApiResponse<ServiceProfessional[]>> {
  return apiFetch<ServiceProfessional[]>("/api/professionals");
}

// ---------------------------------------------------------------------------
// GET /api/professionals/:id — Returns single professional with feedback history
// ---------------------------------------------------------------------------

export async function getProfessionalById(
  id: string
): Promise<ApiResponse<ServiceProfessional & { feedbackHistory: CustomerFeedback[] }>> {
  return apiFetch<ServiceProfessional & { feedbackHistory: CustomerFeedback[] }>(
    `/api/professionals/${id}`
  );
}

// ---------------------------------------------------------------------------
// GET /api/feedback — Returns array of all feedback
// ---------------------------------------------------------------------------

export async function getFeedback(): Promise<ApiResponse<CustomerFeedback[]>> {
  return apiFetch<CustomerFeedback[]>("/api/feedback");
}

// ---------------------------------------------------------------------------
// GET /api/feedback/:id — Returns single feedback with triage result + action draft
// ---------------------------------------------------------------------------

export async function getFeedbackById(
  id: string
): Promise<
  ApiResponse<
    CustomerFeedback & {
      triageResult?: TriageResult;
      actionDraft?: ActionDraft;
    }
  >
> {
  return apiFetch<
    CustomerFeedback & {
      triageResult?: TriageResult;
      actionDraft?: ActionDraft;
    }
  >(`/api/feedback/${id}`);
}

// ---------------------------------------------------------------------------
// POST /api/run-triage-workflow — Triggers Lemma Workflow on all "pending" feedbacks
// ---------------------------------------------------------------------------

export async function runTriageWorkflow(): Promise<ApiResponse<WorkflowResult>> {
  return apiFetch<WorkflowResult>("/api/run-triage-workflow", {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// POST /api/approve-action/:feedbackId — Approves drafted action, updates score
// ---------------------------------------------------------------------------

export async function approveAction(
  feedbackId: string,
  approvedMessage: string
): Promise<ApiResponse<ApproveActionResult>> {
  return apiFetch<ApproveActionResult>(`/api/approve-action/${feedbackId}`, {
    method: "POST",
    body: JSON.stringify({ approvedMessage }),
  });
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/stats — Returns dashboard aggregation stats
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiFetch<DashboardStats>("/api/dashboard/stats");
}
