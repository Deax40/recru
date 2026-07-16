import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { AdminNotificationsView } from "@/components/admin/notifications-view";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const [notifications, operators] = await Promise.all([
    prisma.notification.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "OPERATOR", status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return (
    <>
      <DashboardHeader title="Notifications" role="ADMIN" />
      <PageContent>
        <AdminNotificationsView notifications={notifications as any} operators={operators} />
      </PageContent>
    </>
  );
}
