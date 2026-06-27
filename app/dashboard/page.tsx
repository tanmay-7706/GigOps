import { Users, MessageSquareWarning, AlertTriangle, Star } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Team Health Board
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor professional quality, pending escalations, and team performance
          </p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
          Run Triage Workflow
        </button>
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Professionals", value: "—", icon: Users, color: "text-blue-600" },
          { label: "Pending Feedbacks", value: "—", icon: MessageSquareWarning, color: "text-amber-600" },
          { label: "Active Escalations", value: "—", icon: AlertTriangle, color: "text-red-600" },
          { label: "Avg Quality Score", value: "—", icon: Star, color: "text-green-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content: Professionals Table + Action Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Professionals Table */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Service Professionals
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Professional data will be loaded here from the API.
          </p>
        </div>

        {/* Action Sidebar */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pending Escalations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Escalation queue will appear here after running the triage workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
