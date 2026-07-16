import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Phone, TrendingUp, Award, DollarSign } from "lucide-react";

export default async function OperatorStatsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalCalls, monthCalls, yearCalls, signedTotal, commissionTotal, commissionMonth] =
    await Promise.all([
      prisma.call.count({ where: { operatorId: userId } }),
      prisma.call.count({ where: { operatorId: userId, callDate: { gte: startOfMonth } } }),
      prisma.call.count({ where: { operatorId: userId, callDate: { gte: startOfYear } } }),
      prisma.call.count({ where: { operatorId: userId, status: "FINALIZED_CLIENT" } }),
      prisma.commission.aggregate({
        where: { operatorId: userId, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { operatorId: userId, status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

  const conversionRate = totalCalls > 0 ? Math.round((signedTotal / totalCalls) * 100) : 0;

  return (
    <>
      <DashboardHeader title="Mes statistiques" role="OPERATOR" />
      <PageContent>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total appels"
            value={totalCalls}
            icon={Phone}
            subtitle="Depuis le début"
          />
          <StatCard
            title="Appels ce mois"
            value={monthCalls}
            icon={Phone}
            variant="primary"
            subtitle="Mois en cours"
          />
          <StatCard
            title="Appels cette année"
            value={yearCalls}
            icon={BarChart3}
            subtitle="Année en cours"
          />
          <StatCard
            title="Signatures"
            value={signedTotal}
            icon={Award}
            variant="success"
            subtitle="Dossiers signés"
          />
          <StatCard
            title="Taux de conversion"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            variant={conversionRate >= 5 ? "success" : "default"}
            subtitle="Signatures / Appels"
          />
          <StatCard
            title="Commissions perçues"
            value={formatCurrency(commissionTotal._sum.amount ?? 0)}
            icon={DollarSign}
            variant="success"
            subtitle={`${formatCurrency(commissionMonth._sum.amount ?? 0)} ce mois`}
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Votre performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Taux de conversion global</span>
                <span className="font-semibold">{conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Appels ce mois</span>
                <span className="font-semibold">{monthCalls}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Appels cette année</span>
                <span className="font-semibold">{yearCalls}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Revenus cumulés</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(commissionTotal._sum.amount ?? 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
