"use client";

import { useState } from "react";
import type { FeedbackStatus } from "@/types";

const TABS: { label: string; value: FeedbackStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Triaged", value: "triaged" },
  { label: "Actioned", value: "actioned" },
];

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<FeedbackStatus | "all">("all");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Feedback Queue
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review and manage all customer feedback submissions
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Feedback entries will be loaded here from the API. Currently viewing:{" "}
            <span className="font-semibold capitalize">{activeTab}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
