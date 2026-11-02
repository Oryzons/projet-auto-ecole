import { ApplicationDetailView } from "@/components/admin/application-detail-view";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}
