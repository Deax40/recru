import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminQuotesTable } from "@/components/admin/quotes-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const status = params.status || "";
  const limit = 20;

  const where = {
    ...(search && {
      OR: [
        { clientName: { contains: search } },
        { quoteNumber: { contains: search } },
        { service: { contains: search } },
      ],
    }),
    ...(status && { status: status as any }),
  };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        operator: { select: { firstName: true, lastName: true } },
        commission: { select: { amount: true, status: true } },
        prospect: { select: { companyName: true } },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Devis"
        subtitle={`${total} devis`}
        role="ADMIN"
      >
        <Button asChild size="sm">
          <Link href="/admin/quotes/new">
            <Plus className="h-4 w-4 mr-1" />
            Créer un devis
          </Link>
        </Button>
      </DashboardHeader>
      <PageContent>
        <AdminQuotesTable quotes={quotes as any} total={total} page={page} search={search} filter={status} limit={limit} />
      </PageContent>
    </>
  );
}
