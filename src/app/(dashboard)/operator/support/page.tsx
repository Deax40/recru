import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { SupportPage } from "@/components/operator/support-page";

export default async function OperatorSupportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return (
    <>
      <DashboardHeader title="Support" subtitle="Demandes d'assistance" role="OPERATOR" />
      <PageContent>
        <SupportPage tickets={tickets as any} />
      </PageContent>
    </>
  );
}
