import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { CreateOperatorForm } from "@/components/admin/create-operator-form";

export default async function NewOperatorPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <>
      <DashboardHeader
        title="Créer un opérateur"
        subtitle="Nouvel espace opérateur"
        role="ADMIN"
      />
      <PageContent>
        <CreateOperatorForm />
      </PageContent>
    </>
  );
}
