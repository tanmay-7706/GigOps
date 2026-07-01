"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type { CustomerFeedback, ApproveActionResult } from "@/types";
import { getFeedbackById, approveAction } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";

const ACTION_LABELS: Record<string, string> = {
  ESCALATION: "Escalation",
  QUALITY_FLAG: "Quality Flag",
  TESTIMONIAL: "Testimonial",
};

export function FeedbackDetail({ id }: { id: string }) {
  const [feedback, setFeedback] = useState<CustomerFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [approving, setApproving] = useState(false);
  const [result, setResult] = useState<ApproveActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeedbackById(id).then((res) => {
      if (res.success) {
        setFeedback(res.data);
        setMessage(res.data.actionDraft?.escalationMessage ?? "");
      } else {
        setError(res.error ?? "Feedback not found");
      }
      setLoading(false);
    });
  }, [id]);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    const res = await approveAction(id, message);
    if (res.success) {
      setResult(res.data);
      setFeedback((prev) => (prev ? { ...prev, status: "actioned", approvedMessage: message } : prev));
    } else {
      setError(res.error ?? "Failed to approve action");
    }
    setApproving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopNav />
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopNav />
        <div className="mx-auto max-w-3xl p-6">
          <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error ?? "Feedback not found."}
          </p>
        </div>
      </div>
    );
  }

  const { triageResult, actionDraft } = feedback;
  const isActioned = feedback.status === "actioned";
  const adjustment = actionDraft?.qualityScoreAdjustment ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Feedback Queue
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {feedback.customerName} · {feedback.serviceType}
            </h1>
            {triageResult && <SeverityBadge severity={triageResult.severity} />}
            {isActioned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3" /> Actioned
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Feedback */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Customer Feedback
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Professional" value={feedback.professionalName} />
              <Row label="Customer" value={feedback.customerName} />
              <Row label="Service" value={feedback.serviceType} />
              <Row label="Booking date" value={format(new Date(feedback.bookingDate), "d MMM yyyy")} />
              <Row label="Submitted" value={format(new Date(feedback.submittedAt), "d MMM yyyy, h:mm a")} />
            </dl>
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
              “{feedback.feedbackText}”
            </p>
          </div>

          {/* Right: Triage + Action */}
          <div className="space-y-6">
            {/* Triage Result */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Triage Result
              </h2>
              {triageResult ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Severity</span>
                    <SeverityBadge severity={triageResult.severity} />
                  </div>
                  <Row label="Issue type" value={triageResult.issueType} />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Key details</span>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{triageResult.keyDetails}</p>
                  </div>
                  <Row label="Recommended" value={triageResult.recommendedAction} />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                    <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {Math.round(triageResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Not triaged yet. Run the triage workflow from the dashboard.
                </p>
              )}
            </div>

            {/* Action Draft */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <ClipboardList className="h-5 w-5 text-indigo-600" /> Action Draft
              </h2>
              {actionDraft ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Action type</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {ACTION_LABELS[actionDraft.actionType] ?? actionDraft.actionType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Quality score adjustment</span>
                    <span
                      className={
                        adjustment < 0
                          ? "inline-flex items-center gap-1 font-semibold text-red-600"
                          : "inline-flex items-center gap-1 font-semibold text-green-600"
                      }
                    >
                      {adjustment < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                      {adjustment > 0 ? "+" : ""}
                      {adjustment.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="text-gray-500 dark:text-gray-400">
                      Customer-facing message {isActioned ? "" : "(editable)"}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isActioned}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:disabled:bg-gray-800/50"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Internal note</span>
                    <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      {actionDraft.internalNote}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No action drafted yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Approve bar */}
        {actionDraft && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
            {error && <span className="text-sm text-red-600">{error}</span>}
            {result && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="text-sm font-medium text-green-700 dark:text-green-400"
              >
                Applied — score now {result.updatedScore.toFixed(1)} · status {result.updatedStatus}
              </motion.span>
            )}
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                size="lg"
                onClick={handleApprove}
                disabled={approving || isActioned}
                className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
              >
                {approving ? (
                  <>
                    <Loader2 className="animate-spin" /> Applying…
                  </>
                ) : isActioned ? (
                  <>
                    <CheckCircle2 /> Action Approved
                  </>
                ) : (
                  "Approve Action"
                )}
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
