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
import type { ServiceProfessional, CustomerFeedback, DashboardStats } from "@/types";
import { getProfessionals, getFeedback, getDashboardStats, runTriageWorkflow } from "@/lib/api";
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
    return Promise.all([getDashboardStats(), getProfessionals(), getFeedback()]).then(([s, p, f]) => {
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
    { label: "Total Professionals", num: stats?.totalProfessionals ?? 0, decimals: 0, icon: Users, orb: "from-[#60A5FA] to-[#2563EB]" },
    { label: "Pending Feedbacks", num: stats?.pendingFeedbacks ?? 0, decimals: 0, icon: MessageSquareWarning, orb: "from-[#FBBF24] to-[#F59E0B]" },
    { label: "Active Escalations", num: stats?.activeEscalations ?? 0, decimals: 0, icon: AlertTriangle, orb: "from-[#FB7185] to-[#EF4444]" },
    { label: "Avg Quality Score", num: stats?.avgQualityScore ?? 0, decimals: 1, icon: Star, orb: "from-[#34D399] to-[#10B981]" },
  ];

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        {/* Header */}
        <Reveal>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clay-muted">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-clay-success" />
                </span>
                <ShinyText>Live · Lemma pod</ShinyText>
              </div>
              <h1 className="font-heading text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                <GradientText>Team Health Board</GradientText>
              </h1>
              <p className="mt-2 max-w-xl text-base font-medium text-clay-muted">
                Monitor professional quality, pending escalations, and team performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {runMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-bold text-clay-muted"
                  >
                    {runMessage}
                  </motion.span>
                )}
              </AnimatePresence>
              <Button size="lg" onClick={handleRunWorkflow} disabled={running}>
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
            </div>
          </div>
        </Reveal>

        {/* Progress while running */}
        <div className="mb-7 mt-5 h-1 overflow-hidden rounded-full">
          <AnimatePresence>
            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full rounded-full bg-clay-accent/15"
              >
                <motion.div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C3AED]"
                  animate={{ x: ["-100%", "320%"] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Reveal key={stat.label} delay={0.05 + i * 0.06}>
              <SpotlightCard className="p-5 sm:p-6">
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-clayButton",
                    stat.orb
                  )}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-clay-muted">{stat.label}</div>
                <div className="mt-1 font-heading text-4xl font-black tabular-nums text-clay-fg sm:text-5xl">
                  {loading ? <Skeleton className="mt-1 h-10 w-20" /> : <CountUp value={stat.num} decimals={stat.decimals} />}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Professionals Table */}
          <Reveal delay={0.15} className="lg:col-span-2">
            <div className="overflow-hidden rounded-[32px] border border-white/50 bg-clay-card shadow-clayCard backdrop-blur-xl dark:border-white/10">
              <div className="p-7">
                <h2 className="font-heading text-xl font-extrabold text-clay-fg">Service Professionals</h2>
                <p className="text-sm font-medium text-clay-muted">Sorted by quality score — most at-risk first</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-bold uppercase tracking-wider text-clay-muted">
                    <tr className="border-b border-clay-line">
                      <th className="px-7 py-3">Professional</th>
                      <th className="px-7 py-3">Services</th>
                      <th className="px-7 py-3">Score</th>
                      <th className="px-7 py-3">Complaints</th>
                      <th className="px-7 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-clay-line/60">
                            <td className="px-7 py-4" colSpan={5}>
                              <Skeleton className="h-7 w-full" />
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
                                "border-b border-clay-line/60 transition-colors last:border-0 hover:bg-clay-accent/[0.04]",
                                atRisk && "bg-clay-warning/[0.06]"
                              )}
                            >
                              <td className="px-7 py-4">
                                <Link
                                  href={`/professionals/${p.id}`}
                                  className="font-bold text-clay-fg transition-colors hover:text-clay-accent"
                                >
                                  {p.name}
                                </Link>
                                <div className="text-xs font-medium text-clay-muted">{p.city}</div>
                              </td>
                              <td className="px-7 py-4 font-medium text-clay-muted">{p.serviceTypes.join(", ")}</td>
                              <td className="px-7 py-4">
                                <QualityScore score={p.qualityScore} />
                              </td>
                              <td className="px-7 py-4 font-bold tabular-nums text-clay-fg">{p.activeComplaints}</td>
                              <td className="px-7 py-4">
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
            <div className="rounded-[32px] border border-white/50 bg-clay-card p-7 shadow-clayCard backdrop-blur-xl dark:border-white/10">
              <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-extrabold text-clay-fg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FB7185] to-[#EF4444] text-white shadow-clayButton">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                Escalations
              </h2>
              <p className="mb-5 text-sm font-medium text-clay-muted">Critical cases awaiting approval</p>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : escalations.length === 0 ? (
                <p className="rounded-[20px] border border-dashed border-clay-line p-6 text-center text-sm font-medium text-clay-muted">
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
                          className="block rounded-[20px] border border-[#EF4444]/20 bg-[#EF4444]/[0.07] p-4 transition-all hover:-translate-y-0.5 hover:shadow-clayCard"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-clay-fg">{f.professionalName}</span>
                            <SeverityBadge severity="CRITICAL" />
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs font-medium text-clay-muted">
                            {f.triageResult?.keyDetails ?? f.feedbackText}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-[#DC2626] dark:text-[#F87171]">
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
