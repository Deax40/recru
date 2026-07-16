import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notificationCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  const role = session.user.role as "ADMIN" | "OPERATOR";
  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r">
        <Sidebar role={role} user={user} notificationCount={notificationCount} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64 min-h-screen">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav role={role} user={user} notificationCount={notificationCount} />
    </div>
  );
}
