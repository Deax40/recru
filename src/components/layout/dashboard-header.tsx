"use client";

import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: "ADMIN" | "OPERATOR";
  notificationCount?: number;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  role,
  notificationCount = 0,
  children,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();

  const notifHref = role === "ADMIN" ? "/admin/notifications" : "/operator/notifications";

  return (
    <header className="sticky top-0 z-40 hidden md:flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
      <div className="flex-1">
        <h1 className="font-semibold text-lg text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
          <Link href={notifHref}>
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] px-1 flex items-center justify-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
