"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bell, Phone, FileText, DollarSign, BookOpen,
  MessageSquare, Info, CheckCheck, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  NEW_PROSPECT: Phone,
  RECALL_TODAY: Phone,
  QUOTE_CREATED: FileText,
  QUOTE_SENT: FileText,
  QUOTE_SIGNED: FileText,
  PAYMENT_RECEIVED: DollarSign,
  COMMISSION_VALIDATED: DollarSign,
  COMMISSION_PAID: DollarSign,
  NEW_DOCUMENT: BookOpen,
  MANDATORY_DOCUMENT: BookOpen,
  ADMIN_MESSAGE: MessageSquare,
  SUPPORT_REPLY: MessageSquare,
  ACCOUNT_WARNING: Info,
  NEW_ATTRIBUTION: Phone,
  IMPORTANT_INFO: Info,
};

const typeColors: Record<string, string> = {
  COMMISSION_PAID: "bg-emerald-100 text-emerald-700",
  COMMISSION_VALIDATED: "bg-blue-100 text-blue-700",
  QUOTE_SIGNED: "bg-emerald-100 text-emerald-700",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700",
  MANDATORY_DOCUMENT: "bg-amber-100 text-amber-700",
  ACCOUNT_WARNING: "bg-red-100 text-red-700",
  RECALL_TODAY: "bg-amber-100 text-amber-700",
  default: "bg-primary/10 text-primary",
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link: string | null;
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localNotifs, setLocalNotifs] = useState(notifications);

  const markAllRead = async () => {
    try {
      await fetch("/api/operator/notifications/mark-all-read", { method: "POST" });
      setLocalNotifs(n => n.map(notif => ({ ...notif, isRead: true })));
      startTransition(() => router.refresh());
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Erreur");
    }
  };

  const markRead = async (id: string) => {
    await fetch(`/api/operator/notifications/${id}/read`, { method: "POST" });
    setLocalNotifs(n => n.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
    startTransition(() => router.refresh());
  };

  const unread = localNotifs.filter(n => !n.isRead);

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {localNotifs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {localNotifs.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const colorClass = typeColors[n.type] || typeColors.default;

            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-all cursor-pointer hover:shadow-sm",
                  !n.isRead && "border-l-4 border-l-primary"
                )}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.isRead && (
                        <Badge className="h-4 text-[10px] bg-primary text-primary-foreground">Nouveau</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
