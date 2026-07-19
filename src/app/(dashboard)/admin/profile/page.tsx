import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminProfileForm } from "@/components/admin/admin-profile-form";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, identifier: true,
      email: true, phone: true, createdAt: true, lastLoginAt: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <>
      <DashboardHeader title="Mon profil" role="ADMIN" />
      <PageContent>
        <AdminProfileForm user={user as any} />
      </PageContent>
    </>
  );
}
