// GigOps — TypeScript Interfaces
// Schemas defined from the master prompt

// Schema 1: Service Professional (stored in Lemma Datastore)
export type ProfessionalStatus = "active" | "flagged" | "under-review" | "deactivated";

export interface ServiceProfessional {
  id: string;
  name: string;
  city: string;
  serviceTypes: string[];
  qualityScore: number;
  totalBookings: number;
  activeComplaints: number;
  status: ProfessionalStatus;
  joinedDate: string;
  lastServiceDate: string;
}

// Schema 2: Customer Feedback (stored in Lemma Document Store)
export type FeedbackStatus = "pending" | "triaged" | "actioned" | "resolved";

export interface CustomerFeedback {
  id: string;
  professionalId: string;
  professionalName: string;
  customerName: string;
  serviceType: string;
  bookingDate: string;
  feedbackText: string;
  submittedAt: string;
  status: FeedbackStatus;
}

// Schema 3: Triage Result (output from Triage Agent)
export type Severity = "CRITICAL" | "WARNING" | "POSITIVE";

export interface TriageResult {
  feedbackId: string;
  severity: Severity;
  issueType: string;
  professionalId: string;
  keyDetails: string;
  confidence: number;
  recommendedAction: string;
  processedAt: string;
}

// Schema 4: Action Draft (output from Action Agent)
export type ActionType = "ESCALATION" | "QUALITY_FLAG" | "TESTIMONIAL";

export interface ActionDraft {
  feedbackId: string;
  actionType: ActionType;
  escalationMessage: string;
  internalNote: string;
  qualityScoreAdjustment: number;
  createdAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// Dashboard stats
export interface DashboardStats {
  totalProfessionals: number;
  pendingFeedbacks: number;
  activeEscalations: number;
  avgQualityScore: number;
}

// Workflow run result
export interface WorkflowResult {
  processed: number;
  results: TriageResult[];
}

// Approve action result
export interface ApproveActionResult {
  success: boolean;
  updatedScore: number;
}
