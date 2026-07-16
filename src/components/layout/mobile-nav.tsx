"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Phone, Users, FileText, DollarSign, Menu, X
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface MobileNavProps {
  role: "ADMIN" | "OPERATOR";
  user: { name?: string | null; email?: string | null };
  notificationCount?: number;
}

const quickLinks = {
  OPERATOR: [
    { label: "Dashboard", href: "/operator", icon: LayoutDashboard },
    { label: "Appels", href: "/operator/calls", icon: Phone },
    { label: "Prospects", href: "/operator/prospects", icon: Users },
    { label: "Devis", href: "/operator/quotes", icon: FileText },
    { label: "Commissions", href: "/operator/commissions", icon: DollarSign },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Opérateurs", href: "/admin/operators", icon: Users },
    { label: "Devis", href: "/admin/quotes", icon: FileText },
    { label: "Commissions", href: "/admin/commissions", icon: DollarSign },
  ],
};

export function MobileNav({ role, user, notificationCount }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = quickLinks[role];

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/operator") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar border-t border-sidebar-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar role={role} user={user} notificationCount={notificationCount} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

export function MobileHeader({ title }: { title?: string }) {
  return (
    <header className="md:hidden sticky top-0 z-40 h-14 bg-background/95 backdrop-blur border-b flex items-center px-4 gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
        D
      </div>
      <h1 className="font-semibold text-base truncate">{title || "DeaX CRM"}</h1>
    </header>
  );
}
