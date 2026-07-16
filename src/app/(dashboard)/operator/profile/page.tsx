import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/operator/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, identifier: true,
      email: true, phone: true, commissionRate: true, createdAt: true,
      lastLoginAt: true, role: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <>
      <DashboardHeader title="Mon profil" role={session.user.role as "ADMIN" | "OPERATOR"} />
      <PageContent>
        <ProfileForm user={user as any} />
      </PageContent>
    </>
  );
}
