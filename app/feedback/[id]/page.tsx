interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <a
          href="/feedback"
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ← Back to Feedback Queue
        </a>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Feedback Detail
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Viewing feedback: {id}
        </p>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Feedback Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Customer Feedback
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Full feedback text, customer info, booking details, and severity badge will appear here.
          </p>
        </div>

        {/* Right: Triage Result + Action Draft */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Triage Result
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Severity, issue type, key details, and confidence score will appear here after triage.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Action Draft
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Escalation message, internal note, and quality adjustment will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Approve Action */}
      <div className="mt-6 flex justify-end">
        <button className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
          Approve Action
        </button>
      </div>
    </div>
  );
}
