"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, SECTORS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, ToggleLeft } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  zone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { assignments: number };
}

export function CampaignsManager({
  campaigns,
  operators,
}: {
  campaigns: Campaign[];
  operators: { id: string; firstName: string; lastName: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sector: "",
    zone: "",
    isActive: true,
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name) { toast.error("Le nom est requis"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Campagne créée !");
      setOpen(false);
      setForm({ name: "", description: "", sector: "", zone: "", isActive: true });
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{campaigns.length} campagne(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une campagne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Campagne Restauration IDF" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Secteur cible</Label>
                <Select value={form.sector} onValueChange={(v) => set("sector", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Choisir un secteur..." /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zone géographique</Label>
                <Input value={form.zone} onChange={(e) => set("zone", e.target.value)} placeholder="Ex: Île-de-France" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Campagne active</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Aucune campagne créée
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={c.isActive ? "default" : "secondary"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {c.description && (
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {c.sector && <span>Secteur : {c.sector}</span>}
                  {c.zone && <span>Zone : {c.zone}</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {c._count.assignments} opérateur(s) assigné(s)
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => toggleActive(c.id, c.isActive)}
                  >
                    <ToggleLeft className="h-3 w-3 mr-1" />
                    {c.isActive ? "Désactiver" : "Activer"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
