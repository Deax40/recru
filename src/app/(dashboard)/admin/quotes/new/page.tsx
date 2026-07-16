import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminQuoteForm } from "@/components/admin/quote-form";

export default async function NewQuotePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [operators, prospects] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OPERATOR", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, commissionRate: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.prospect.findMany({
      select: { id: true, companyName: true, contactName: true, operatorId: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Créer un devis" role="ADMIN" />
      <PageContent>
        <AdminQuoteForm operators={operators} prospects={prospects} />
      </PageContent>
    </>
  );
}
