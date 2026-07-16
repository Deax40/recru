import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FileText, Eye } from "lucide-react";
import Link from "next/link";

export default async function QuotesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const [quotes, notifications] = await Promise.all([
    prisma.quote.findMany({
      where: { operatorId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        prospect: { select: { companyName: true } },
        commission: { select: { amount: true, status: true } },
      },
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Mes devis"
        subtitle={`${quotes.length} devis`}
        role="OPERATOR"
        notificationCount={notifications}
      />
      <PageContent>
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Aucun devis pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les devis sont créés par l&apos;administrateur suite à vos demandes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Devis</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prestation</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant HT</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Envoyé le</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{q.quoteNumber}</td>
                      <td className="px-4 py-3 font-medium">{q.clientName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{q.service}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(q.amountHT)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="quote" status={q.status} />
                      </td>
                      <td className="px-4 py-3">
                        {q.commission ? (
                          <div>
                            <span className="text-sm font-semibold text-emerald-600">
                              {formatCurrency(q.commission.amount)}
                            </span>
                            <div className="mt-0.5">
                              <StatusBadge type="commission" status={q.commission.status} />
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(q.sentAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/operator/quotes/${q.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {quotes.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{q.quoteNumber}</p>
                        <p className="font-semibold">{q.clientName}</p>
                        <p className="text-sm text-muted-foreground">{q.service}</p>
                      </div>
                      <StatusBadge type="quote" status={q.status} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(q.amountHT)}</p>
                        {q.commission && (
                          <p className="text-xs text-emerald-600 font-medium">
                            Commission : {formatCurrency(q.commission.amount)}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/operator/quotes/${q.id}`}>Voir</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
