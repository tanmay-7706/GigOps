"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  MessageSquareWarning,
  AlertTriangle,
  Star,
  Play,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type {
  ServiceProfessional,
  CustomerFeedback,
  DashboardStats,
} from "@/types";
import {
  getProfessionals,
  getFeedback,
  getDashboardStats,
  runTriageWorkflow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QualityScore } from "@/components/shared/QualityScore";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
import { CountUp } from "@/components/motion/CountUp";
import { GradientText } from "@/components/motion/GradientText";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShinyText } from "@/components/motion/ShinyText";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [professionals, setProfessionals] = useState<ServiceProfessional[]>([]);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      getDashboardStats(),
      getProfessionals(),
      getFeedback(),
    ]).then(([s, p, f]) => {
      if (s.success) setStats(s.data);
      if (p.success) setProfessionals(p.data);
      if (f.success) setFeedback(f.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRunWorkflow() {
    setRunning(true);
    setRunMessage(null);
    const res = await runTriageWorkflow();
    if (res.success) {
      const { processed, failed } = res.data;
      setRunMessage(
        `Processed ${processed} feedback${processed === 1 ? "" : "s"}` +
          (failed.length ? ` · ${failed.length} failed` : "")
      );
    } else {
      setRunMessage(res.error ?? "Workflow failed");
    }
    await load();
    setRunning(false);
  }

  const escalations = feedback.filter(
    (f) => f.status === "triaged" && f.triageResult?.severity === "CRITICAL"
  );

  const statCards = [
    { label: "Total Professionals", num: stats?.totalProfessionals ?? 0, decimals: 0, icon: Users, color: "text-blue-600" },
    { label: "Pending Feedbacks", num: stats?.pendingFeedbacks ?? 0, decimals: 0, icon: MessageSquareWarning, color: "text-amber-600" },
    { label: "Active Escalations", num: stats?.activeEscalations ?? 0, decimals: 0, icon: AlertTriangle, color: "text-red-600" },
    { label: "Avg Quality Score", num: stats?.avgQualityScore ?? 0, decimals: 1, icon: Star, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <Reveal>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <ShinyText>Live · Lemma pod</ShinyText>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                <GradientText>Team Health Board</GradientText>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor professional quality, pending escalations, and team performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {runMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >
                    {runMessage}
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button
                  size="lg"
                  onClick={handleRunWorkflow}
                  disabled={running}
                  className="bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
                >
                  {running ? (
                    <>
                      <Loader2 className="animate-spin" /> Running triage…
                    </>
                  ) : (
                    <>
                      <Play /> Run Triage Workflow
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </Reveal>

        {/* Indeterminate progress while running */}
        <div className="mb-6 h-0.5 overflow-hidden rounded-full">
          <AnimatePresence>
            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full rounded-full bg-indigo-500/15"
              >
                <motion.div
                  className="h-full w-1/3 rounded-full bg-indigo-500"
                  animate={{ x: ["-100%", "320%"] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Reveal key={stat.label} delay={0.05 + i * 0.06}>
              <SpotlightCard className="p-5">
                <div className="flex items-center gap-3">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </span>
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <CountUp value={stat.num} decimals={stat.decimals} />
                  )}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Professionals Table */}
          <Reveal delay={0.15} className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Service Professionals</h2>
                <p className="text-sm text-muted-foreground">
                  Sorted by quality score — most at-risk first
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-400">
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 font-medium">Professional</th>
                      <th className="px-6 py-3 font-medium">Services</th>
                      <th className="px-6 py-3 font-medium">Score</th>
                      <th className="px-6 py-3 font-medium">Complaints</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                            <td className="px-6 py-4" colSpan={5}>
                              <Skeleton className="h-6 w-full" />
                            </td>
                          </tr>
                        ))
                      : professionals.map((p, i) => {
                          const atRisk = p.status === "flagged" || p.status === "under-review";
                          return (
                            <motion.tr
                              key={p.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              className={cn(
                                "border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/40",
                                atRisk && "bg-amber-50/40 dark:bg-amber-950/10"
                              )}
                            >
                              <td className="px-6 py-3">
                                <Link
                                  href={`/professionals/${p.id}`}
                                  className="font-medium text-gray-900 transition-colors hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                                >
                                  {p.name}
                                </Link>
                                <div className="text-xs text-gray-400">{p.city}</div>
                              </td>
                              <td className="px-6 py-3 text-muted-foreground">
                                {p.serviceTypes.join(", ")}
                              </td>
                              <td className="px-6 py-3">
                                <QualityScore score={p.qualityScore} />
                              </td>
                              <td className="px-6 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                                {p.activeComplaints}
                              </td>
                              <td className="px-6 py-3">
                                <StatusBadge status={p.status} />
                              </td>
                            </motion.tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* Escalations Sidebar */}
          <Reveal delay={0.2}>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Pending Escalations
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Critical cases awaiting your approval
              </p>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : escalations.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No critical escalations. Run the triage workflow to surface them.
                </p>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence>
                    {escalations.map((f, i) => (
                      <motion.li
                        key={f.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Link
                          href={`/feedback/${f.id}`}
                          className="block rounded-lg border border-red-200 bg-red-50 p-3 transition-all hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {f.professionalName}
                            </span>
                            <SeverityBadge severity="CRITICAL" />
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                            {f.triageResult?.keyDetails ?? f.feedbackText}
                          </p>
                          <span className="mt-2 inline-flex items-center text-xs font-medium text-red-700 dark:text-red-400">
                            Review case <ChevronRight className="h-3 w-3" />
                          </span>
                        </Link>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
