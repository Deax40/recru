import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { CampaignsManager } from "@/components/admin/campaigns-manager";

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const operators = await prisma.user.findMany({
    where: { role: "OPERATOR", status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <>
      <DashboardHeader title="Campagnes" role="ADMIN" />
      <PageContent>
        <CampaignsManager campaigns={campaigns as any} operators={operators} />
      </PageContent>
    </>
  );
}
