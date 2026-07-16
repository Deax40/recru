import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContent } from "@/components/shared/page-header";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  return (
    <>
      <DashboardHeader title="Paramètres" role="ADMIN" />
      <PageContent>
        <SettingsManager settings={settings} />
      </PageContent>
    </>
  );
}
