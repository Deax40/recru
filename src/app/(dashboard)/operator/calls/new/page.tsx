import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { NewCallForm } from "@/components/operator/new-call-form";
import { prisma } from "@/lib/prisma";

export default async function NewCallPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const prospects = await prisma.prospect.findMany({
    where: { operatorId: session.user.id },
    select: { id: true, companyName: true, contactName: true, phone: true },
    orderBy: { companyName: "asc" },
  });

  return (
    <>
      <DashboardHeader
        title="Enregistrer un appel"
        subtitle="Saisissez les informations de votre appel"
        role="OPERATOR"
      />
      <PageContent>
        <NewCallForm prospects={prospects} />
      </PageContent>
    </>
  );
}
