import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { CallsTable } from "@/components/operator/calls-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

interface SearchParams {
  page?: string;
  search?: string;
  filter?: string;
  sort?: string;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const filter = params.filter || "";
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    operatorId: session.user.id,
    ...(search && {
      OR: [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
    ...(filter && { status: filter as any }),
  };

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: { prospect: { select: { id: true, companyName: true } } },
    }),
    prisma.call.count({ where }),
  ]);

  const notificationCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <>
      <DashboardHeader
        title="Mes appels"
        subtitle={`${total} appel${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}`}
        role="OPERATOR"
        notificationCount={notificationCount}
      >
        <Button asChild size="sm">
          <Link href="/operator/calls/new">
            <Plus className="h-4 w-4 mr-1" />
            Nouvel appel
          </Link>
        </Button>
      </DashboardHeader>
      <PageContent>
        <CallsTable
          calls={calls as any}
          total={total}
          page={page}
          search={search}
          filter={filter}
          limit={limit}
        />
      </PageContent>
    </>
  );
}
