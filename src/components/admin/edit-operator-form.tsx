"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, KeyRound } from "lucide-react";

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  status: string;
  commissionRate: number;
  mustChangePassword: boolean;
}

export function EditOperatorForm({ operator }: { operator: Operator }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: operator.firstName,
    lastName: operator.lastName,
    email: operator.email ?? "",
    phone: operator.phone ?? "",
    commissionRate: String(operator.commissionRate),
    status: operator.status,
    mustChangePassword: operator.mustChangePassword,
  });
  const [newPassword, setNewPassword] = useState("");

  const set = (k: string, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        commissionRate: parseFloat(form.commissionRate),
        status: form.status,
        mustChangePassword: form.mustChangePassword,
      };
      if (newPassword) body.newPassword = newPassword;

      const res = await fetch(`/api/admin/operators/${operator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      toast.success("Opérateur mis à jour !");
      router.push(`/admin/operators/${operator.id}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Identifiant</Label>
            <Input value={operator.identifier} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">L'identifiant ne peut pas être modifié</p>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Taux de commission (%)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={form.commissionRate}
              onChange={(e) => set("commissionRate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Forcer le changement de mot de passe</Label>
              <p className="text-xs text-muted-foreground">L'opérateur devra changer son mdp à la connexion</p>
            </div>
            <Switch
              checked={form.mustChangePassword}
              onCheckedChange={(v) => set("mustChangePassword", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Nouveau mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Mot de passe (laisser vide pour ne pas changer)</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </div>
  );
}
