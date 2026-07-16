import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { Users, Eye, Plus } from "lucide-react";
import Link from "next/link";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const status = params.status || "";
  const limit = 20;

  const where = {
    operatorId: session.user.id,
    ...(search && {
      OR: [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
      ],
    }),
    ...(status && { status: status as any }),
  };

  const [prospects, total, notifications] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: { select: { calls: true, quotes: true } },
      },
    }),
    prisma.prospect.count({ where }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Mes prospects"
        subtitle={`${total} prospect${total > 1 ? "s" : ""}`}
        role="OPERATOR"
        notificationCount={notifications}
      />
      <PageContent>
        {prospects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">Aucun prospect pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les prospects se créent automatiquement lorsque vous enregistrez un appel avec un statut positif.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entreprise</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Secteur</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Appels</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Devis</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Créé le</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {prospects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.companyName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.contactName || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.sector || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="prospect" status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p._count.calls}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p._count.quotes}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/operator/prospects/${p.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {prospects.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{p.companyName}</p>
                        {p.contactName && <p className="text-sm text-muted-foreground">{p.contactName}</p>}
                        {p.sector && <p className="text-xs text-muted-foreground mt-1">{p.sector}</p>}
                      </div>
                      <StatusBadge type="prospect" status={p.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{p._count.calls} appel(s)</span>
                        <span>{p._count.quotes} devis</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/operator/prospects/${p.id}`}>Voir la fiche</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
