import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { PageContent } from "@/components/shared/page-header";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime, CALL_STATUS_LABELS, COMMISSION_STATUS_LABELS } from "@/lib/utils";
import {
  Phone, Users, FileText, DollarSign, TrendingUp,
  Calendar, CheckCircle, Clock, Bell, Star
} from "lucide-react";
import { startOfDay, startOfWeek, subDays } from "date-fns";
import { OperatorChart } from "@/components/operator/operator-chart";
import { RecallWidget } from "@/components/operator/recall-widget";

export default async function OperatorDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const userId = session.user.id;
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [
    totalCalls,
    callsToday,
    callsThisWeek,
    prospects,
    interestedProspects,
    meetingsScheduled,
    quotesInProgress,
    quotesSigned,
    commissions,
    notifications,
    recalls,
    recentActivity,
  ] = await Promise.all([
    prisma.call.count({ where: { operatorId: userId } }),
    prisma.call.count({ where: { operatorId: userId, callDate: { gte: today } } }),
    prisma.call.count({ where: { operatorId: userId, callDate: { gte: weekStart } } }),
    prisma.prospect.count({ where: { operatorId: userId } }),
    prisma.prospect.count({ where: { operatorId: userId, status: "INTERESTED" } }),
    prisma.prospect.count({ where: { operatorId: userId, status: "MEETING_SCHEDULED" } }),
    prisma.quote.count({ where: { operatorId: userId, status: { in: ["IN_PREPARATION", "SENT", "WAITING_RESPONSE"] } } }),
    prisma.quote.count({ where: { operatorId: userId, status: { in: ["SIGNED", "FULLY_PAID"] } } }),
    prisma.commission.findMany({
      where: { operatorId: userId },
      select: { amount: true, status: true },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.call.findMany({
      where: { operatorId: userId, callbackDate: { gte: today }, status: "TO_CALLBACK" },
      orderBy: { callbackDate: "asc" },
      take: 5,
    }),
    prisma.call.findMany({
      where: { operatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, companyName: true, status: true, createdAt: true },
    }),
  ]);

  const totalGenerated = commissions
    .filter(c => c.status !== "CANCELLED")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const pendingCommissions = commissions
    .filter(c => ["ESTIMATION", "WAITING_SIGNATURE", "WAITING_PAYMENT", "TO_VALIDATE", "VALIDATED", "PAYMENT_SCHEDULED"].includes(c.status))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const validatedCommissions = commissions
    .filter(c => ["VALIDATED", "PAYMENT_SCHEDULED"].includes(c.status))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const paidCommissions = commissions
    .filter(c => c.status === "PAID")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const conversionRate = totalCalls > 0
    ? Math.round((quotesSigned / totalCalls) * 100)
    : 0;

  // Données pour le graphique (7 derniers jours)
  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      return prisma.call.count({
        where: { operatorId: userId, callDate: { gte: dayStart, lt: dayEnd } },
      }).then(count => ({
        date: date.toLocaleDateString("fr-FR", { weekday: "short" }),
        appels: count,
      }));
    })
  );

  return (
    <>
      <DashboardHeader
        title={`Bonjour, ${session.user.name?.split(" ")[0]} 👋`}
        subtitle="Votre tableau de bord personnel"
        role="OPERATOR"
        notificationCount={notifications}
      />
      <PageContent>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Appels total" value={totalCalls} subtitle={`${callsToday} aujourd'hui`} icon={Phone} />
          <StatCard title="Cette semaine" value={callsThisWeek} subtitle="appels" icon={Calendar} />
          <StatCard title="Prospects" value={prospects} subtitle={`${interestedProspects} intéressés`} icon={Users} />
          <StatCard title="RDV obtenus" value={meetingsScheduled} icon={CheckCircle} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Devis en cours" value={quotesInProgress} icon={FileText} />
          <StatCard title="Devis signés" value={quotesSigned} icon={CheckCircle} variant="success" />
          <StatCard title="Commissions générées" value={formatCurrency(totalGenerated)} icon={DollarSign} />
          <StatCard title="Taux de conversion" value={`${conversionRate}%`} icon={TrendingUp} />
        </div>

        {/* Commissions breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard title="En attente" value={formatCurrency(pendingCommissions)} icon={Clock} variant="warning" />
          <StatCard title="Validées" value={formatCurrency(validatedCommissions)} icon={CheckCircle} variant="primary" />
          <StatCard title="Payées" value={formatCurrency(paidCommissions)} icon={DollarSign} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <OperatorChart data={chartData} />
          </div>

          {/* Recalls widget */}
          <RecallWidget recalls={recalls} />
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Dernières actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune activité récente
              </p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((call) => (
                  <li key={call.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{call.companyName}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(call.createdAt)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {CALL_STATUS_LABELS[call.status] || call.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
