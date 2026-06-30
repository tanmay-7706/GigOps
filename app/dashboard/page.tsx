"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QualityScore } from "@/components/shared/QualityScore";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TopNav } from "@/components/shared/TopNav";
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
    { label: "Total Professionals", value: stats?.totalProfessionals, icon: Users, color: "text-blue-600" },
    { label: "Pending Feedbacks", value: stats?.pendingFeedbacks, icon: MessageSquareWarning, color: "text-amber-600" },
    { label: "Active Escalations", value: stats?.activeEscalations, icon: AlertTriangle, color: "text-red-600" },
    { label: "Avg Quality Score", value: stats?.avgQualityScore?.toFixed(1), icon: Star, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Team Health Board
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor professional quality, pending escalations, and team performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            {runMessage && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {runMessage}
              </span>
            )}
            <Button
              size="lg"
              onClick={handleRunWorkflow}
              disabled={running}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
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
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {loading ? "—" : stat.value ?? "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Professionals Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
            <div className="border-b border-gray-100 p-6 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Service Professionals
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by quality score — most at-risk first
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-3 font-medium">Professional</th>
                    <th className="px-6 py-3 font-medium">Services</th>
                    <th className="px-6 py-3 font-medium">Score</th>
                    <th className="px-6 py-3 font-medium">Complaints</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </td>
                    </tr>
                  ) : (
                    professionals.map((p) => {
                      const atRisk = p.status === "flagged" || p.status === "under-review";
                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            "border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/40",
                            atRisk && "bg-amber-50/40 dark:bg-amber-950/10"
                          )}
                        >
                          <td className="px-6 py-3">
                            <Link
                              href={`/professionals/${p.id}`}
                              className="font-medium text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                            >
                              {p.name}
                            </Link>
                            <div className="text-xs text-gray-400">{p.city}</div>
                          </td>
                          <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Escalations Sidebar */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pending Escalations
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Critical cases awaiting your approval
            </p>

            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : escalations.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-800">
                No critical escalations. Run the triage workflow to surface them.
              </p>
            ) : (
              <ul className="space-y-3">
                {escalations.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/feedback/${f.id}`}
                      className="block rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
