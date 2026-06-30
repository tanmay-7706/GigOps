import { ProfessionalDetail } from "@/components/professionals/ProfessionalDetail";

interface ProfessionalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfessionalDetailPage({ params }: ProfessionalDetailPageProps) {
  const { id } = await params;
  return <ProfessionalDetail id={id} />;
}
