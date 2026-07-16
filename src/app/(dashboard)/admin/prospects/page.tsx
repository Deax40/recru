import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminProspectsView } from "@/components/admin/prospects-view";

export default async function AdminProspectsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [prospects, operators] = await Promise.all([
    prisma.prospect.findMany({
      include: {
        operator: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { calls: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "OPERATOR" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Prospects" role="ADMIN" />
      <PageContent>
        <AdminProspectsView prospects={prospects as any} operators={operators} />
      </PageContent>
    </>
  );
}
