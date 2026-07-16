import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { EditOperatorForm } from "@/components/admin/edit-operator-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditOperatorPage({
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
      mustChangePassword: true,
    },
  });

  if (!operator) notFound();

  return (
    <>
      <DashboardHeader title="Modifier l'opérateur" role="ADMIN" />
      <PageContent>
        <div className="mb-6">
          <Link href={`/admin/operators/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour au profil
            </Button>
          </Link>
        </div>
        <div className="max-w-lg">
          <EditOperatorForm operator={operator} />
        </div>
      </PageContent>
    </>
  );
}
