import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { ImportExportManager } from "@/components/admin/import-export-manager";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [operators, importLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OPERATOR", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.importLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Import / Export" role="ADMIN" />
      <PageContent>
        <ImportExportManager operators={operators} importLogs={importLogs as any} />
      </PageContent>
    </>
  );
}
