import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { OperatorsTable } from "@/components/admin/operators-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function OperatorsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const operators = await prisma.user.findMany({
    where: { role: "OPERATOR" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { calls: true, prospects: true, quotes: true, commissions: true } },
    },
  });

  return (
    <>
      <DashboardHeader
        title="Opérateurs"
        subtitle={`${operators.length} opérateur${operators.length > 1 ? "s" : ""}`}
        role="ADMIN"
      >
        <Button asChild size="sm">
          <Link href="/admin/operators/new">
            <Plus className="h-4 w-4 mr-1" />
            Créer un opérateur
          </Link>
        </Button>
      </DashboardHeader>
      <PageContent>
        <OperatorsTable operators={operators as any} />
      </PageContent>
    </>
  );
}
