"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Phone, Users, FileText, DollarSign,
  BookOpen, HelpCircle, Bell, User, BarChart2, History,
  Target, FileCode, MessageSquare, ChevronRight, LogOut,
  Settings, ClipboardList, Upload, Shield, Megaphone,
  FolderOpen, Star, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

const operatorNav: NavItem[] = [
  { label: "Tableau de bord", href: "/operator", icon: LayoutDashboard },
  { label: "Mes appels", href: "/operator/calls", icon: Phone },
  { label: "Mes prospects", href: "/operator/prospects", icon: Users },
  { label: "Mes devis", href: "/operator/quotes", icon: FileText },
  { label: "Mes commissions", href: "/operator/commissions", icon: DollarSign },
  { label: "Mes statistiques", href: "/operator/stats", icon: BarChart2 },
  { label: "Mes objectifs", href: "/operator/objectives", icon: Target },
  { label: "Mes notifications", href: "/operator/notifications", icon: Bell },
  { label: "Documents", href: "/operator/documents", icon: BookOpen },
  { label: "FAQ", href: "/operator/faq", icon: HelpCircle },
  { label: "Guide de démarrage", href: "/operator/guide", icon: Globe },
  { label: "Scripts d'appel", href: "/operator/scripts", icon: FileCode },
  { label: "Objections", href: "/operator/objections", icon: MessageSquare },
  { label: "Support", href: "/operator/support", icon: MessageSquare },
  { label: "Mon profil", href: "/operator/profile", icon: User },
  { label: "Historique", href: "/operator/history", icon: History },
];

const adminNav: NavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Opérateurs", href: "/admin/operators", icon: Users },
  { label: "Prospects", href: "/admin/prospects", icon: ClipboardList },
  { label: "Appels", href: "/admin/calls", icon: Phone },
  { label: "Campagnes", href: "/admin/campaigns", icon: Megaphone },
  { label: "Devis", href: "/admin/quotes", icon: FileText },
  { label: "Commissions", href: "/admin/commissions", icon: DollarSign },
  { label: "Documents", href: "/admin/documents", icon: FolderOpen },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { label: "Contenu CMS", href: "/admin/content", icon: Globe },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Support", href: "/admin/support", icon: MessageSquare },
  { label: "Import / Export", href: "/admin/import", icon: Upload },
  { label: "Journal d'audit", href: "/admin/audit", icon: Shield },
  { label: "Classement", href: "/admin/ranking", icon: Star },
  { label: "Paramètres", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  role: "ADMIN" | "OPERATOR";
  user: { name?: string | null; email?: string | null };
  notificationCount?: number;
}

export function Sidebar({ role, user, notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "ADMIN" ? adminNav : operatorNav;

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/operator") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow">
          D
        </div>
        <div>
          <p className="font-bold text-base text-sidebar-foreground">DeaX CRM</p>
          <p className="text-xs text-sidebar-foreground/60">
            {role === "ADMIN" ? "Administration" : "Espace opérateur"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isBell = item.href.includes("notifications");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isBell && notificationCount > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full bg-red-500 text-white text-xs px-1.5">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                  {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user.name || "Utilisateur"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {role === "ADMIN" ? "Administrateur" : "Opérateur"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
