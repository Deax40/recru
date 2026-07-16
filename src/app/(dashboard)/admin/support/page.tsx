import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminSupportView } from "@/components/admin/support-view";
import { StatCard } from "@/components/shared/stat-card";
import { MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [tickets, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const byStatus = Object.fromEntries(stats.map(s => [s.status, s._count.id]));

  return (
    <>
      <DashboardHeader title="Support" subtitle="Demandes des opérateurs" role="ADMIN" />
      <PageContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Ouvertes" value={byStatus.OPEN || 0} icon={MessageSquare} />
          <StatCard title="En cours" value={byStatus.IN_PROGRESS || 0} icon={Clock} variant="warning" />
          <StatCard title="Résolues" value={byStatus.RESOLVED || 0} icon={CheckCircle} variant="success" />
          <StatCard title="Urgentes" value={tickets.filter(t => t.priority === "URGENT" && t.status !== "CLOSED").length} icon={AlertTriangle} variant="danger" />
        </div>

        <AdminSupportView tickets={tickets as any} />
      </PageContent>
    </>
  );
}
