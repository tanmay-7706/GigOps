import { FeedbackDetail } from "@/components/feedback/FeedbackDetail";

interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = await params;
  return <FeedbackDetail id={id} />;
}
