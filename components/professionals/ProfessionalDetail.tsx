"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Star,
  CalendarCheck,
  MessageSquareWarning,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ServiceProfessional, CustomerFeedback } from "@/types";
import { getProfessionalById } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QualityScore } from "@/components/shared/QualityScore";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { cn } from "@/lib/utils";

type ProfessionalWithHistory = ServiceProfessional & { feedbackHistory: CustomerFeedback[] };

type RiskLevel = "HIGH" | "WATCH" | "HEALTHY";

function assessRisk(p: ServiceProfessional): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  if (p.status === "under-review") reasons.push("Currently under review");
  if (p.qualityScore < 3.0) reasons.push(`Quality score critically low (${p.qualityScore.toFixed(1)})`);
  else if (p.qualityScore < 3.8) reasons.push(`Quality score below target (${p.qualityScore.toFixed(1)})`);
  if (p.activeComplaints >= 3) reasons.push(`${p.activeComplaints} active complaints`);
  else if (p.activeComplaints >= 2) reasons.push(`${p.activeComplaints} active complaints`);
  if (p.status === "flagged") reasons.push("Flagged by the system");

  const high = p.status === "under-review" || p.qualityScore < 3.0 || p.activeComplaints >= 3;
  const watch = p.status === "flagged" || p.qualityScore < 3.8 || p.activeComplaints >= 2;
  const level: RiskLevel = high ? "HIGH" : watch ? "WATCH" : "HEALTHY";
  if (level === "HEALTHY") reasons.push("No active risk signals — performing well");
  return { level, reasons };
}

const RISK_UI: Record<RiskLevel, { label: string; classes: string; orb: string; icon: typeof ShieldAlert }> = {
  HIGH: {
    label: "High risk — likely to churn or face deactivation",
    classes: "border-[#EF4444]/20 bg-[#EF4444]/[0.08] text-[#B91C1C] dark:text-[#F87171]",
    orb: "from-[#FB7185] to-[#EF4444]",
    icon: ShieldAlert,
  },
  WATCH: {
    label: "Watch — early warning signs",
    classes: "border-[#F59E0B]/25 bg-[#F59E0B]/[0.1] text-[#B45309] dark:text-[#FBBF24]",
    orb: "from-[#FBBF24] to-[#F59E0B]",
    icon: Eye,
  },
  HEALTHY: {
    label: "Healthy — top performer",
    classes: "border-[#10B981]/20 bg-[#10B981]/[0.09] text-[#047857] dark:text-[#34D399]",
    orb: "from-[#34D399] to-[#10B981]",
    icon: ShieldCheck,
  },
};

export function ProfessionalDetail({ id }: { id: string }) {
  const [pro, setPro] = useState<ProfessionalWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfessionalById(id).then((res) => {
      if (res.success) setPro(res.data as ProfessionalWithHistory);
      else setError(res.error ?? "Professional not found");
      setLoading(false);
    });
  }, [id]);

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

  if (!pro) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="mx-auto max-w-3xl px-4 pt-8">
          <p className="rounded-[24px] border border-[#EF4444]/20 bg-[#EF4444]/[0.07] p-6 text-sm font-medium text-[#DC2626] dark:text-[#F87171]">
            {error ?? "Professional not found."}
          </p>
        </div>
      </div>
    );
  }

  const risk = assessRisk(pro);
  const ui = RISK_UI[risk.level];
  const history = [...pro.feedbackHistory].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const counts = history.reduce(
    (acc, f) => {
      const s = f.triageResult?.severity;
      if (s === "CRITICAL") acc.critical += 1;
      else if (s === "WARNING") acc.warning += 1;
      else if (s === "POSITIVE") acc.positive += 1;
      return acc;
    },
    { critical: 0, warning: 0, positive: 0 }
  );

  const stats = [
    { label: "Quality score", num: pro.qualityScore, decimals: 1, icon: Star, orb: "from-[#34D399] to-[#10B981]" },
    { label: "Total bookings", num: pro.totalBookings, decimals: 0, icon: CalendarCheck, orb: "from-[#60A5FA] to-[#2563EB]" },
    { label: "Active complaints", num: pro.activeComplaints, decimals: 0, icon: MessageSquareWarning, orb: "from-[#FB7185] to-[#EF4444]" },
  ];

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-bold text-clay-accent hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Team Health Board
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-black tracking-tight text-clay-fg sm:text-4xl">{pro.name}</h1>
          <StatusBadge status={pro.status} />
          <QualityScore score={pro.qualityScore} />
        </div>
        <p className="mt-1.5 text-sm font-medium text-clay-muted">
          {pro.city} · {pro.serviceTypes.join(", ")}
        </p>

        {/* Risk banner — the early-warning signal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn("mt-6 flex items-start gap-4 rounded-[28px] border p-5", ui.classes)}
        >
          <motion.span
            animate={risk.level === "HIGH" ? { scale: [1, 1.12, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-clayButton",
              ui.orb
            )}
          >
            <ui.icon className="h-5 w-5" />
          </motion.span>
          <div>
            <p className="font-heading font-extrabold">{ui.label}</p>
            <ul className="mt-1.5 list-inside list-disc text-sm font-medium opacity-90">
              {risk.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={0.08 + i * 0.06}>
              <SpotlightCard className="p-6">
                <div
                  className={cn(
                    "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-clayButton",
                    s.orb
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold text-clay-muted">{s.label}</div>
                <div className="mt-1 font-heading text-4xl font-black tabular-nums text-clay-fg">
                  <CountUp value={s.num} decimals={s.decimals} />
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Feedback history */}
        <div className="mt-8 overflow-hidden rounded-[32px] border border-white/50 bg-clay-card shadow-clayCard backdrop-blur-xl dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clay-line p-7">
            <h2 className="font-heading text-lg font-extrabold text-clay-fg">
              Feedback history ({history.length})
            </h2>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#EF4444]/12 px-2.5 py-0.5 text-[#DC2626] dark:text-[#F87171]">
                {counts.critical} critical
              </span>
              <span className="rounded-full bg-[#F59E0B]/15 px-2.5 py-0.5 text-[#B45309] dark:text-[#FBBF24]">
                {counts.warning} warning
              </span>
              <span className="rounded-full bg-[#10B981]/14 px-2.5 py-0.5 text-[#047857] dark:text-[#34D399]">
                {counts.positive} positive
              </span>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="p-7 text-sm font-medium text-clay-muted">No feedback recorded yet.</p>
          ) : (
            <ul className="divide-y divide-clay-line/60">
              {history.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/feedback/${f.id}`}
                    className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-clay-accent/[0.04]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-clay-fg">{f.customerName}</span>
                        <span className="text-xs font-medium text-clay-muted">· {f.serviceType}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-clay-muted">{f.feedbackText}</p>
                      <span className="mt-1 block text-xs font-medium text-clay-muted/80">
                        {formatDistanceToNow(new Date(f.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {f.triageResult ? (
                      <SeverityBadge severity={f.triageResult.severity} />
                    ) : (
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-clay-muted dark:bg-white/10">
                        Pending
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
