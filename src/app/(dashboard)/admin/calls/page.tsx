import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminCallsView } from "@/components/admin/calls-view";

export default async function AdminCallsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [calls, operators] = await Promise.all([
    prisma.call.findMany({
      include: { operator: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { callDate: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: "OPERATOR" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Tous les appels" role="ADMIN" />
      <PageContent>
        <AdminCallsView calls={calls as any} operators={operators} />
      </PageContent>
    </>
  );
}
