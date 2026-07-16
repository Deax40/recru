import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { NotificationsList } from "@/components/operator/notifications-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OPERATOR") redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <DashboardHeader
        title="Mes notifications"
        subtitle={`${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`}
        role="OPERATOR"
        notificationCount={unreadCount}
      />
      <PageContent>
        <NotificationsList notifications={notifications as any} />
      </PageContent>
    </>
  );
}
