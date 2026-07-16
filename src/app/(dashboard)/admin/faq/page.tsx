import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminFAQManager } from "@/components/admin/faq-manager";

export default async function AdminFAQPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return (
    <>
      <DashboardHeader title="FAQ" subtitle="Gérer les questions fréquentes" role="ADMIN" />
      <PageContent>
        <AdminFAQManager faqs={faqs} />
      </PageContent>
    </>
  );
}
