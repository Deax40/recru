import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  role: "ADMIN" | "OPERATOR";
  notificationCount?: number;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  role,
  notificationCount,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <>
      <DashboardHeader
        title={title}
        subtitle={subtitle}
        role={role}
        notificationCount={notificationCount}
      >
        {actions}
      </DashboardHeader>
      {/* Mobile header */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        {actions && <div className="mt-3">{actions}</div>}
      </div>
      {children}
    </>
  );
}

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("p-4 md:p-6 space-y-6", className)}>
      {children}
    </div>
  );
}
