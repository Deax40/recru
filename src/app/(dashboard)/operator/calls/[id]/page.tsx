import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { CallDetailView } from "@/components/operator/call-detail-view";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      prospect: true,
      editHistory: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!call || call.operatorId !== session.user.id) notFound();

  return (
    <>
      <DashboardHeader title="Détail de l'appel" role="OPERATOR" />
      <PageContent>
        <CallDetailView call={call as any} />
      </PageContent>
    </>
  );
}
