import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency, formatPercent } from "@/lib/utils";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function CommissionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const [commissions, notifications] = await Promise.all([
    prisma.commission.findMany({
      where: { operatorId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        quote: { select: { quoteNumber: true, clientName: true, service: true, amountHT: true, amountReceived: true } },
      },
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  const total = commissions.filter(c => c.status !== "CANCELLED").reduce((s, c) => s + c.amount, 0);
  const pending = commissions
    .filter(c => ["ESTIMATION", "WAITING_SIGNATURE", "WAITING_PAYMENT", "TO_VALIDATE"].includes(c.status))
    .reduce((s, c) => s + c.amount, 0);
  const validated = commissions
    .filter(c => ["VALIDATED", "PAYMENT_SCHEDULED"].includes(c.status))
    .reduce((s, c) => s + c.amount, 0);
  const paid = commissions
    .filter(c => c.status === "PAID")
    .reduce((s, c) => s + c.amount, 0);

  // Grouped by month
  const byMonth = commissions.reduce((acc, c) => {
    const key = format(new Date(c.createdAt), "MMMM yyyy", { locale: fr });
    if (!acc[key]) acc[key] = { total: 0, paid: 0, count: 0 };
    if (c.status !== "CANCELLED") {
      acc[key].total += c.amount;
      acc[key].count++;
    }
    if (c.status === "PAID") acc[key].paid += c.amount;
    return acc;
  }, {} as Record<string, { total: number; paid: number; count: number }>);

  return (
    <>
      <DashboardHeader
        title="Mes commissions"
        subtitle="Suivi détaillé de vos commissions"
        role="OPERATOR"
        notificationCount={notifications}
      />
      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total généré" value={formatCurrency(total)} icon={TrendingUp} />
          <StatCard title="En attente" value={formatCurrency(pending)} icon={Clock} variant="warning" />
          <StatCard title="Validées" value={formatCurrency(validated)} icon={CheckCircle} variant="primary" />
          <StatCard title="Payées" value={formatCurrency(paid)} icon={DollarSign} variant="success" />
        </div>

        {/* Par mois */}
        {Object.keys(byMonth).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détail par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(byMonth).map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium capitalize">{month}</p>
                      <p className="text-xs text-muted-foreground">{data.count} commission(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(data.total)}</p>
                      <p className="text-xs text-emerald-600">{formatCurrency(data.paid)} payé</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste complète */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique complet</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune commission</p>
            ) : (
              <div className="space-y-0 divide-y">
                {commissions.map((c) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{c.quote.clientName}</p>
                      <p className="text-sm text-muted-foreground">{c.quote.service}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        N° {c.quote.quoteNumber} — Base : {formatCurrency(c.baseAmount)} — Taux : {formatPercent(c.rate)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(c.amount)}</p>
                      <StatusBadge type="commission" status={c.status} />
                      {c.paidAt && (
                        <p className="text-xs text-muted-foreground">Payée le {formatDate(c.paidAt)}</p>
                      )}
                      {c.scheduledAt && c.status !== "PAID" && (
                        <p className="text-xs text-primary">Prévu le {formatDate(c.scheduledAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
