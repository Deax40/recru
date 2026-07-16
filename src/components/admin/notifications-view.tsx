"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Send, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string };
}

export function AdminNotificationsView({
  notifications,
  operators,
}: {
  notifications: Notification[];
  operators: { id: string; firstName: string; lastName: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ userId: "ALL", title: "", message: "", type: "INFO" });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error("Titre et message requis");
      return;
    }
    setLoading(true);
    try {
      const targets = form.userId === "ALL" ? operators : operators.filter((o) => o.id === form.userId);
      await Promise.all(
        targets.map((op) =>
          fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: op.id, title: form.title, message: form.message, type: form.type }),
          })
        )
      );
      toast.success(`Notification envoyée à ${targets.length} opérateur(s)`);
      setOpen(false);
      setForm({ userId: "ALL", title: "", message: "", type: "INFO" });
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{notifications.length} notification(s) envoyée(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Envoyer une notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Destinataire</Label>
                <Select value={form.userId} onValueChange={(v) => set("userId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les opérateurs actifs</SelectItem>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.firstName} {op.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Information</SelectItem>
                    <SelectItem value="SUCCESS">Succès</SelectItem>
                    <SelectItem value="WARNING">Avertissement</SelectItem>
                    <SelectItem value="NEW_DOCUMENT">Nouveau document</SelectItem>
                    <SelectItem value="SYSTEM">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Titre de la notification" />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Contenu du message..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSend} disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune notification envoyée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destinataire</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lu</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{n.user.firstName} {n.user.lastName}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${n.isRead ? "text-emerald-600" : "text-amber-600"}`}>
                      {n.isRead ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
