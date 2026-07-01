"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CustomerFeedback, FeedbackStatus } from "@/types";
import { getFeedback } from "@/lib/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
import { GradientText } from "@/components/motion/GradientText";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/skeleton";
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
        <Reveal>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              <GradientText>Feedback Queue</GradientText>
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review and manage all customer feedback submissions
            </p>
          </div>
        </Reveal>

        {/* Filter Tabs with sliding indicator */}
        <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {activeTab === tab.value && (
                <motion.span
                  layoutId="feedback-tab-pill"
                  className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-gray-800"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {tab.label}
                <span className="ml-1.5 text-xs text-gray-400">{counts[tab.value] ?? 0}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No feedback in this view.
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/feedback/${f.id}`}
                  className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
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
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
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
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Pending
                        </span>
                      )}
                      {f.actionDraft && (
                        <span className="text-xs font-medium text-muted-foreground">
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
