import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency, CALL_STATUS_LABELS } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Edit, TrendingUp } from "lucide-react";

export default async function AdminOperatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const operator = await prisma.user.findUnique({
    where: { id, role: "OPERATOR" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      identifier: true,
      email: true,
      phone: true,
      status: true,
      commissionRate: true,
      createdAt: true,
      lastLoginAt: true,
      mustChangePassword: true,
    },
  });

  if (!operator) notFound();

  const [callStats, commissionStats, recentCalls] = await Promise.all([
    prisma.call.groupBy({
      by: ["status"],
      where: { operatorId: id },
      _count: true,
    }),
    prisma.commission.aggregate({
      where: { operatorId: id, status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.call.findMany({
      where: { operatorId: id },
      orderBy: { callDate: "desc" },
      take: 10,
    }),
  ]);

  const totalCalls = callStats.reduce((s, g) => s + g._count, 0);
  const signedCount = callStats.find((g) => g.status === "FINALIZED_CLIENT")?._count ?? 0;

  return (
    <>
      <DashboardHeader title={`${operator.firstName} ${operator.lastName}`} role="ADMIN" />
      <PageContent>
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/operators">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour aux opérateurs
            </Button>
          </Link>
          <div className="flex gap-2">
            <StatusBadge type="support" status={operator.status} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {operator.firstName[0]}{operator.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">{operator.firstName} {operator.lastName}</p>
                  <p className="text-sm text-muted-foreground">@{operator.identifier}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {operator.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{operator.email}</span>
                  </div>
                )}
                {operator.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{operator.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Commission : {operator.commissionRate}%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>Créé le : {formatDate(operator.createdAt)}</p>
                <p>Dernière connexion : {formatDate(operator.lastLoginAt)}</p>
                {operator.mustChangePassword && (
                  <p className="text-amber-600 font-medium">Doit changer son mot de passe</p>
                )}
              </div>
              <Link href={`/admin/operators/${id}/edit`}>
                <Button className="w-full" size="sm">
                  <Edit className="mr-1.5 h-4 w-4" />
                  Modifier
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total appels"
                value={totalCalls}
                icon={Phone}
                subtitle="Depuis le début"
              />
              <StatCard
                title="Signatures obtenues"
                value={signedCount}
                icon={TrendingUp}
                variant="success"
                subtitle={`sur ${totalCalls} appels`}
              />
              <StatCard
                title="Commissions payées"
                value={commissionStats._count}
                icon={TrendingUp}
                variant="primary"
                subtitle="Dossiers clôturés"
              />
              <StatCard
                title="Total gagné"
                value={formatCurrency(commissionStats._sum.amount ?? 0)}
                icon={TrendingUp}
                variant="success"
                subtitle="Commissions versées"
              />
            </div>

            {/* Recent calls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Derniers appels</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentCalls.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">Aucun appel</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {recentCalls.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{c.companyName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{CALL_STATUS_LABELS[c.status] ?? c.status}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.callDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
