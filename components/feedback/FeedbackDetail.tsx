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
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
import { Reveal } from "@/components/motion/Reveal";

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
      <div className="min-h-screen">
        <TopNav />
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-clay-accent" />
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <p className="rounded-[24px] border border-[#EF4444]/20 bg-[#EF4444]/[0.07] p-6 text-sm font-medium text-[#DC2626] dark:text-[#F87171]">
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
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {/* Header */}
        <Reveal>
          <div className="mb-6">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-1 text-sm font-bold text-clay-accent hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Feedback Queue
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-black tracking-tight text-clay-fg">
                {feedback.customerName} · {feedback.serviceType}
              </h1>
              {triageResult && <SeverityBadge severity={triageResult.severity} />}
              {isActioned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/14 px-3 py-1 text-xs font-bold text-[#047857] dark:text-[#34D399]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Actioned
                </span>
              )}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Feedback */}
          <Reveal delay={0.05}>
            <Card className="p-7">
              <h2 className="mb-4 font-heading text-lg font-extrabold text-clay-fg">Customer Feedback</h2>
              <dl className="space-y-2.5 text-sm">
                <Row label="Professional" value={feedback.professionalName} />
                <Row label="Customer" value={feedback.customerName} />
                <Row label="Service" value={feedback.serviceType} />
                <Row label="Booking date" value={format(new Date(feedback.bookingDate), "d MMM yyyy")} />
                <Row label="Submitted" value={format(new Date(feedback.submittedAt), "d MMM yyyy, h:mm a")} />
              </dl>
              <p className="mt-5 rounded-[20px] bg-input p-5 text-sm font-medium leading-relaxed text-clay-fg/90 shadow-clayPressed">
                “{feedback.feedbackText}”
              </p>
            </Card>
          </Reveal>

          {/* Right: Triage + Action */}
          <div className="space-y-6">
            <Reveal delay={0.1}>
              <Card className="p-7">
                <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-extrabold text-clay-fg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  Triage Result
                </h2>
                {triageResult ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-clay-muted">Severity</span>
                      <SeverityBadge severity={triageResult.severity} />
                    </div>
                    <Row label="Issue type" value={triageResult.issueType} />
                    <div>
                      <span className="font-medium text-clay-muted">Key details</span>
                      <p className="mt-1 font-medium text-clay-fg/90">{triageResult.keyDetails}</p>
                    </div>
                    <Row label="Recommended" value={triageResult.recommendedAction} />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-clay-muted">Confidence</span>
                      <span className="font-heading font-extrabold tabular-nums text-clay-fg">
                        {Math.round(triageResult.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-clay-muted">
                    Not triaged yet. Run the triage workflow from the dashboard.
                  </p>
                )}
              </Card>
            </Reveal>

            <Reveal delay={0.15}>
              <Card className="p-7">
                <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-extrabold text-clay-fg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0ABFC] to-[#DB2777] text-white shadow-clayButton">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  Action Draft
                </h2>
                {actionDraft ? (
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-clay-muted">Action type</span>
                      <span className="font-bold text-clay-fg">
                        {ACTION_LABELS[actionDraft.actionType] ?? actionDraft.actionType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-clay-muted">Quality score adjustment</span>
                      <span
                        className={
                          adjustment < 0
                            ? "inline-flex items-center gap-1 font-heading font-extrabold text-[#DC2626] dark:text-[#F87171]"
                            : "inline-flex items-center gap-1 font-heading font-extrabold text-[#047857] dark:text-[#34D399]"
                        }
                      >
                        {adjustment < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        {adjustment > 0 ? "+" : ""}
                        {adjustment.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <label className="font-medium text-clay-muted">
                        Customer-facing message {isActioned ? "" : "(editable)"}
                      </label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isActioned}
                        rows={4}
                        className="mt-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <span className="font-medium text-clay-muted">Internal note</span>
                      <p className="mt-1.5 rounded-[16px] bg-[#F59E0B]/[0.1] p-4 font-medium text-[#92400E] dark:text-[#FBBF24]">
                        {actionDraft.internalNote}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-clay-muted">No action drafted yet.</p>
                )}
              </Card>
            </Reveal>
          </div>
        </div>

        {/* Approve bar */}
        {actionDraft && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
            {error && <span className="text-sm font-medium text-[#DC2626]">{error}</span>}
            {result && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="text-sm font-bold text-[#047857] dark:text-[#34D399]"
              >
                Applied — score now {result.updatedScore.toFixed(1)} · status {result.updatedStatus}
              </motion.span>
            )}
            <Button size="lg" onClick={handleApprove} disabled={approving || isActioned}>
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
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-medium text-clay-muted">{label}</span>
      <span className="text-right font-bold text-clay-fg">{value}</span>
    </div>
  );
}
