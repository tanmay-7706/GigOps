"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CustomerFeedback, FeedbackStatus } from "@/types";
import { getFeedback } from "@/lib/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
import { cn } from "@/lib/utils";

const TABS: { label: string; value: FeedbackStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Triaged", value: "triaged" },
  { label: "Actioned", value: "actioned" },
];

const ACTION_LABELS: Record<string, string> = {
  ESCALATION: "Escalation",
  QUALITY_FLAG: "Quality Flag",
  TESTIMONIAL: "Testimonial",
};

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackStatus | "all">("all");
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedback().then((res) => {
      if (res.success) setFeedback(res.data);
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: feedback.length };
    for (const f of feedback) c[f.status] = (c[f.status] ?? 0) + 1;
    return c;
  }, [feedback]);

  const visible =
    activeTab === "all" ? feedback : feedback.filter((f) => f.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Feedback Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and manage all customer feedback submissions
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-gray-400">{counts[tab.value] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-gray-800">
            No feedback in this view.
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((f) => (
              <Link
                key={f.id}
                href={`/feedback/${f.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {f.customerName}
                      </span>
                      <span className="text-xs text-gray-400">on</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {f.professionalName}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {f.serviceType}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {f.feedbackText}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                    {f.triageResult ? (
                      <SeverityBadge severity={f.triageResult.severity} />
                    ) : (
                      <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700">
                        Pending
                      </span>
                    )}
                    {f.actionDraft && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {ACTION_LABELS[f.actionDraft.actionType] ?? f.actionDraft.actionType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>{formatDistanceToNow(new Date(f.submittedAt), { addSuffix: true })}</span>
                  <span className="inline-flex items-center font-medium text-indigo-600 dark:text-indigo-400">
                    Open <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
