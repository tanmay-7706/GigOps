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

  const visible = activeTab === "all" ? feedback : feedback.filter((f) => f.status === activeTab);

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <Reveal>
          <div className="mb-6">
            <h1 className="font-heading text-4xl font-black tracking-tight sm:text-5xl">
              <GradientText>Feedback Queue</GradientText>
            </h1>
            <p className="mt-2 text-base font-medium text-clay-muted">
              Review and manage all customer feedback submissions.
            </p>
          </div>
        </Reveal>

        {/* Filter Tabs with sliding indicator */}
        <div className="mb-6 flex w-fit gap-1 rounded-[20px] border border-white/50 bg-clay-card p-1.5 shadow-clayCard backdrop-blur-xl dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "relative rounded-[14px] px-4 py-2 text-sm font-bold transition-colors",
                activeTab === tab.value ? "text-clay-accent" : "text-clay-muted hover:text-clay-fg"
              )}
            >
              {activeTab === tab.value && (
                <motion.span
                  layoutId="feedback-tab-pill"
                  className="absolute inset-0 rounded-[14px] bg-clay-accent/12"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {tab.label}
                <span className="ml-1.5 text-xs opacity-60">{counts[tab.value] ?? 0}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-[28px]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-[28px] border border-dashed border-clay-line p-12 text-center text-sm font-medium text-clay-muted">
            No feedback in this view.
          </p>
        ) : (
          <div className="space-y-4">
            {visible.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/feedback/${f.id}`}
                  className="block rounded-[28px] border border-white/50 bg-clay-card p-6 shadow-clayCard backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-clayCardHover dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-clay-fg">{f.customerName}</span>
                        <span className="text-xs font-medium text-clay-muted">on</span>
                        <span className="text-sm font-bold text-clay-fg/80">{f.professionalName}</span>
                        <span className="rounded-full bg-clay-accent/10 px-2.5 py-0.5 text-xs font-bold text-clay-accent">
                          {f.serviceType}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-clay-muted">{f.feedbackText}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                      {f.triageResult ? (
                        <SeverityBadge severity={f.triageResult.severity} />
                      ) : (
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-clay-muted dark:bg-white/10">
                          Pending
                        </span>
                      )}
                      {f.actionDraft && (
                        <span className="text-xs font-bold text-clay-muted">
                          {ACTION_LABELS[f.actionDraft.actionType] ?? f.actionDraft.actionType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-clay-muted">
                    <span>{formatDistanceToNow(new Date(f.submittedAt), { addSuffix: true })}</span>
                    <span className="inline-flex items-center gap-0.5 font-bold text-clay-accent">
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
