import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminCommissionsView } from "@/components/admin/commissions-view";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";

export default async function AdminCommissionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [commissions, operators] = await Promise.all([
    prisma.commission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        operator: { select: { id: true, firstName: true, lastName: true } },
        quote: { select: { quoteNumber: true, clientName: true, service: true, amountHT: true, amountReceived: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "OPERATOR", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const total = commissions.filter(c => c.status !== "CANCELLED").reduce((s, c) => s + c.amount, 0);
  const pending = commissions.filter(c => ["TO_VALIDATE"].includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const validated = commissions.filter(c => ["VALIDATED", "PAYMENT_SCHEDULED"].includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const paid = commissions.filter(c => c.status === "PAID").reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <DashboardHeader title="Commissions" subtitle="Gestion des commissions opérateurs" role="ADMIN" />
      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total généré" value={formatCurrency(total)} icon={TrendingUp} />
          <StatCard title="À valider" value={formatCurrency(pending)} icon={Clock} variant="warning" />
          <StatCard title="Validées" value={formatCurrency(validated)} icon={CheckCircle} variant="primary" />
          <StatCard title="Payées" value={formatCurrency(paid)} icon={DollarSign} variant="success" />
        </div>

        <AdminCommissionsView commissions={commissions as any} operators={operators} />
      </PageContent>
    </>
  );
}
