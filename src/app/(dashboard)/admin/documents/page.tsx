import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminDocumentsManager } from "@/components/admin/documents-manager";

export default async function AdminDocumentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [categories, documents] = await Promise.all([
    prisma.documentCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.document.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
        _count: { select: { reads: true } },
      },
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Documents" subtitle="Bibliothèque de formation" role="ADMIN" />
      <PageContent>
        <AdminDocumentsManager categories={categories} documents={documents as any} />
      </PageContent>
    </>
  );
}
