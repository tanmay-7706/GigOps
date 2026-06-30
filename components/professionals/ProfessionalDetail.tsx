"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const RISK_UI: Record<RiskLevel, { label: string; classes: string; icon: typeof ShieldAlert }> = {
  HIGH: {
    label: "High risk — likely to churn or face deactivation",
    classes: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
    icon: ShieldAlert,
  },
  WATCH: {
    label: "Watch — early warning signs",
    classes: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
    icon: Eye,
  },
  HEALTHY: {
    label: "Healthy — top performer",
    classes: "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300",
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopNav />
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopNav />
        <div className="mx-auto max-w-3xl p-6">
          <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
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
    { label: "Quality score", value: pro.qualityScore.toFixed(1), icon: Star, color: "text-green-600" },
    { label: "Total bookings", value: pro.totalBookings, icon: CalendarCheck, color: "text-blue-600" },
    { label: "Active complaints", value: pro.activeComplaints, icon: MessageSquareWarning, color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <div className="mx-auto max-w-5xl p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Team Health Board
        </Link>

        {/* Header */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pro.name}</h1>
          <StatusBadge status={pro.status} />
          <QualityScore score={pro.qualityScore} />
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {pro.city} · {pro.serviceTypes.join(", ")}
        </p>

        {/* Risk banner — the early-warning signal */}
        <div className={cn("mt-5 flex items-start gap-3 rounded-xl border p-4", ui.classes)}>
          <ui.icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{ui.label}</p>
            <ul className="mt-1 list-inside list-disc text-sm opacity-90">
              {risk.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center gap-2">
                <s.icon className={cn("h-5 w-5", s.color)} />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Feedback history */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Feedback history ({history.length})
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                {counts.critical} critical
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {counts.warning} warning
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                {counts.positive} positive
              </span>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No feedback recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {history.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/feedback/${f.id}`}
                    className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {f.customerName}
                        </span>
                        <span className="text-xs text-gray-400">· {f.serviceType}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {f.feedbackText}
                      </p>
                      <span className="mt-1 block text-xs text-gray-400">
                        {formatDistanceToNow(new Date(f.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {f.triageResult ? (
                      <SeverityBadge severity={f.triageResult.severity} />
                    ) : (
                      <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700">
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
