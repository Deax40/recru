import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variants = {
  default: "bg-card",
  primary: "bg-primary text-primary-foreground",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
};

const iconVariants = {
  default: "bg-primary/10 text-primary",
  primary: "bg-white/20 text-white",
  success: "bg-white/20 text-white",
  warning: "bg-white/20 text-white",
  danger: "bg-white/20 text-white",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const isColored = variant !== "default";

  return (
    <Card className={cn("overflow-hidden border-0 shadow-sm", variants[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", isColored ? "text-white/80" : "text-muted-foreground")}>
              {title}
            </p>
            <p className={cn("text-2xl font-bold mt-1", isColored ? "text-white" : "text-foreground")}>
              {value}
            </p>
            {subtitle && (
              <p className={cn("text-xs mt-1", isColored ? "text-white/70" : "text-muted-foreground")}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs mt-2", isColored ? "text-white/80" : "text-muted-foreground")}>
                <span className={cn("font-medium", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                <span>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ml-3", iconVariants[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
