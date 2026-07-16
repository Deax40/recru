"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, CALL_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Phone, ArrowLeft, Building2, Clock, Star } from "lucide-react";
import Link from "next/link";
import { SECTORS, SERVICES } from "@/lib/utils";

interface Call {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  sector: string | null;
  city: string | null;
  status: string;
  interestLevel: number | null;
  callSummary: string | null;
  internalNote: string | null;
  callDate: Date;
  callbackDate: Date | null;
  isLocked: boolean;
  serviceNeeded: string | null;
  prospect: { id: string; companyName: string } | null;
  editHistory: { id: string; createdAt: Date; field: string; oldValue: string | null; newValue: string | null }[];
}

const ALL_STATUSES = Object.keys(CALL_STATUS_LABELS);

export function CallDetailView({ call }: { call: Call }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: call.status,
    callSummary: call.callSummary ?? "",
    internalNote: call.internalNote ?? "",
    interestLevel: String(call.interestLevel ?? ""),
    callbackDate: call.callbackDate ? new Date(call.callbackDate).toISOString().split("T")[0] : "",
    serviceNeeded: call.serviceNeeded ?? "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/operator/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          callSummary: form.callSummary || null,
          internalNote: form.internalNote || null,
          interestLevel: form.interestLevel ? parseInt(form.interestLevel) : null,
          callbackDate: form.callbackDate || null,
          serviceNeeded: form.serviceNeeded || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }
      toast.success("Appel mis à jour !");
      setEditing(false);
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link href="/operator/calls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Mes appels
          </Button>
        </Link>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-bold">{call.companyName}</h2>
              </div>
              {call.contactName && <p className="text-muted-foreground">{call.contactName}</p>}
              {call.phone && (
                <p className="flex items-center gap-1.5 text-sm mt-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />{call.phone}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <StatusBadge type="call" status={call.status} />
              {call.interestLevel && (
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < call.interestLevel! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(call.callDate)}
              </p>
            </div>
          </div>

          {call.prospect && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                Prospect lié :{" "}
                <Link href={`/operator/prospects/${call.prospect.id}`} className="text-primary hover:underline font-medium">
                  {call.prospect.companyName}
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      {!editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Détails</CardTitle>
            {!call.isLocked && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {call.sector && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Secteur</p>
                <p className="text-sm">{call.sector}</p>
              </div>
            )}
            {call.serviceNeeded && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Service souhaité</p>
                <p className="text-sm">{call.serviceNeeded}</p>
              </div>
            )}
            {call.callSummary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Résumé de l'appel</p>
                <p className="text-sm whitespace-pre-wrap">{call.callSummary}</p>
              </div>
            )}
            {call.callbackDate && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Date de rappel</p>
                <p className="text-sm">{formatDate(call.callbackDate)}</p>
              </div>
            )}
            {call.isLocked && (
              <p className="text-sm text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                Cet appel a été verrouillé par l'administrateur et ne peut plus être modifié.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modifier l'appel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d'intérêt (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={form.interestLevel}
                onChange={(e) => set("interestLevel", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service souhaité</Label>
              <Select value={form.serviceNeeded} onValueChange={(v) => set("serviceNeeded", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un service..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Résumé de l'appel</Label>
              <Textarea
                rows={4}
                value={form.callSummary}
                onChange={(e) => set("callSummary", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date de rappel</Label>
              <Input
                type="datetime-local"
                value={form.callbackDate}
                onChange={(e) => set("callbackDate", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit history */}
      {call.editHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des modifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {call.editHistory.map((h) => (
              <div key={h.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                <p className="text-muted-foreground capitalize">{h.field} : {h.oldValue || "—"} → {h.newValue || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
