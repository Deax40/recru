import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, CALL_STATUS_LABELS } from "@/lib/utils";
import {
  Users, Phone, FileText, DollarSign, TrendingUp, Target,
  CheckCircle, Clock, BarChart2, Activity
} from "lucide-react";
import Link from "next/link";
import { AdminChart } from "@/components/admin/admin-chart";
import { startOfDay, startOfMonth } from "date-fns";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const [
    activeOperators,
    totalOperators,
    totalCalls,
    callsToday,
    totalProspects,
    activeQuotes,
    signedQuotes,
    commissions,
    pendingSupport,
    notifications,
    recentCalls,
    operatorStats,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "OPERATOR", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "OPERATOR" } }),
    prisma.call.count(),
    prisma.call.count({ where: { callDate: { gte: today } } }),
    prisma.prospect.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.quote.count({ where: { status: { in: ["IN_PREPARATION", "SENT", "WAITING_RESPONSE", "FOLLOW_UP_NEEDED"] } } }),
    prisma.quote.count({ where: { status: { in: ["SIGNED", "FULLY_PAID"] } } }),
    prisma.commission.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { amount: true, status: true },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { operator: { select: { firstName: true, lastName: true } } },
    }),
    prisma.user.findMany({
      where: { role: "OPERATOR" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        _count: { select: { calls: true, prospects: true, quotes: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = commissions
    .filter(c => ["PAID", "PAYMENT_SCHEDULED", "VALIDATED"].includes(c.status))
    .reduce((s, c) => s + c.amount / 0.30, 0);

  const commissionsDue = commissions
    .filter(c => ["TO_VALIDATE", "VALIDATED", "PAYMENT_SCHEDULED"].includes(c.status))
    .reduce((s, c) => s + c.amount, 0);

  const commissionsPaid = commissions
    .filter(c => c.status === "PAID")
    .reduce((s, c) => s + c.amount, 0);

  // Monthly chart data (last 6 months)
  const now = new Date();
  const chartData = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const [calls, quotes] = await Promise.all([
        prisma.call.count({ where: { callDate: { gte: d, lt: end } } }),
        prisma.quote.count({ where: { status: { in: ["SIGNED", "FULLY_PAID"] }, createdAt: { gte: d, lt: end } } }),
      ]);
      return {
        month: d.toLocaleDateString("fr-FR", { month: "short" }),
        appels: calls,
        signatures: quotes,
      };
    })
  );

  return (
    <>
      <DashboardHeader
        title="Tableau de bord"
        subtitle="Vue globale de l'activité DeaX"
        role="ADMIN"
        notificationCount={notifications}
      />
      <PageContent>
        {/* KPIs ligne 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Opérateurs actifs"
            value={activeOperators}
            subtitle={`${totalOperators} au total`}
            icon={Users}
          />
          <StatCard
            title="Appels total"
            value={totalCalls}
            subtitle={`${callsToday} aujourd'hui`}
            icon={Phone}
          />
          <StatCard title="Prospects actifs" value={totalProspects} icon={Target} />
          <StatCard title="Appels du jour" value={callsToday} icon={Activity} />
        </div>

        {/* KPIs ligne 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Devis en cours" value={activeQuotes} icon={FileText} />
          <StatCard title="Devis signés" value={signedQuotes} icon={CheckCircle} variant="success" />
          <StatCard title="CA estimé" value={formatCurrency(totalRevenue)} icon={TrendingUp} />
          <StatCard title="Commissions dues" value={formatCurrency(commissionsDue)} icon={Clock} variant="warning" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard title="Commissions payées" value={formatCurrency(commissionsPaid)} icon={DollarSign} variant="success" />
          <StatCard title="Tickets en cours" value={pendingSupport} icon={BarChart2} />
          <StatCard title="Devis signés ce mois" value={signedQuotes} icon={CheckCircle} variant="primary" />
        </div>

        {/* Chart + Operator performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <AdminChart data={chartData} />
          </div>

          {/* Top opérateurs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance opérateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operatorStats.slice(0, 8).map((op, i) => (
                  <div key={op.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{op.firstName} {op.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {op._count.calls} appels • {op._count.quotes} devis
                      </p>
                    </div>
                    <Badge variant={op.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                      {op.status === "ACTIVE" ? "Actif" : "Suspendu"}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/admin/operators">Gérer les opérateurs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent calls */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Derniers appels enregistrés</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/calls">Voir tout</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{call.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {call.operator.firstName} {call.operator.lastName} — {formatDateTime(call.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {CALL_STATUS_LABELS[call.status] || call.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" asChild>
            <Link href="/admin/operators/new">
              <Users className="h-5 w-5" />
              <span className="text-xs">Créer un opérateur</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" asChild>
            <Link href="/admin/quotes/new">
              <FileText className="h-5 w-5" />
              <span className="text-xs">Créer un devis</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" asChild>
            <Link href="/admin/import">
              <Target className="h-5 w-5" />
              <span className="text-xs">Importer des prospects</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" asChild>
            <Link href="/admin/commissions">
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">Valider commissions</span>
            </Link>
          </Button>
        </div>
      </PageContent>
    </>
  );
}
