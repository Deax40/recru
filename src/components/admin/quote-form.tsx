"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, QUOTE_STATUS_LABELS, generateQuoteNumber } from "@/lib/utils";

const schema = z.object({
  quoteNumber: z.string().min(1, "Numéro requis"),
  clientName: z.string().min(1, "Client requis"),
  service: z.string().min(1, "Prestation requise"),
  amountHT: z.number().min(0, "Montant invalide"),
  vatRate: z.number().min(0).max(100).default(20),
  status: z.string(),
  sentAt: z.string().optional(),
  validUntil: z.string().optional(),
  internalComment: z.string().optional(),
  operatorComment: z.string().optional(),
  operatorId: z.string().min(1, "Opérateur requis"),
  prospectId: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

const statuses = [
  "INFO_TO_COMPLETE", "IN_PREPARATION", "SENT", "WAITING_RESPONSE",
  "FOLLOW_UP_NEEDED", "ACCEPTED", "SIGNED", "DEPOSIT_RECEIVED",
  "PARTIALLY_PAID", "FULLY_PAID", "REFUSED", "CANCELLED", "EXPIRED",
];

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  commissionRate: number;
}

interface Prospect {
  id: string;
  companyName: string;
  contactName: string | null;
  operatorId: string | null;
}

export function AdminQuoteForm({
  operators,
  prospects,
  defaultValues,
  isEdit = false,
  quoteId,
}: {
  operators: Operator[];
  prospects: Prospect[];
  defaultValues?: Partial<FormData>;
  isEdit?: boolean;
  quoteId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      quoteNumber: generateQuoteNumber(),
      vatRate: 20,
      commissionRate: 30,
      status: "IN_PREPARATION",
      ...defaultValues,
    },
  });

  const amountHT = watch("amountHT") || 0;
  const vatRate = watch("vatRate") || 20;
  const commissionRate = watch("commissionRate") || 30;
  const amountTTC = amountHT * (1 + vatRate / 100);
  const commissionAmount = amountHT * (commissionRate / 100);

  const handleOperatorChange = (opId: string) => {
    setValue("operatorId", opId);
    const op = operators.find(o => o.id === opId);
    if (op) setValue("commissionRate", op.commissionRate);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/quotes/${quoteId}` : "/api/admin/quotes";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amountTTC }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur");
        return;
      }

      toast.success(isEdit ? "Devis mis à jour !" : "Devis créé !");
      router.push("/admin/quotes");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 max-w-3xl">
      {/* Informations devis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations du devis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="quoteNumber">N° de devis *</Label>
            <Input id="quoteNumber" className="font-mono" {...register("quoteNumber")} />
            {errors.quoteNumber && <p className="text-xs text-destructive">{errors.quoteNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Statut *</Label>
            <Select defaultValue={defaultValues?.status || "IN_PREPARATION"} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="clientName">Nom du client *</Label>
            <Input id="clientName" placeholder="Entreprise SAS" {...register("clientName")} />
            {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="service">Prestation *</Label>
            <Input id="service" placeholder="Site e-commerce + maintenance" {...register("service")} />
            {errors.service && <p className="text-xs text-destructive">{errors.service.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sentAt">Date d&apos;envoi</Label>
            <Input id="sentAt" type="date" {...register("sentAt")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Date de validité</Label>
            <Input id="validUntil" type="date" {...register("validUntil")} />
          </div>
        </CardContent>
      </Card>

      {/* Montants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Montants</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amountHT">Montant HT (€) *</Label>
            <Input
              id="amountHT"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amountHT", { valueAsNumber: true })}
            />
            {errors.amountHT && <p className="text-xs text-destructive">{errors.amountHT.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vatRate">TVA (%)</Label>
            <Input id="vatRate" type="number" step="0.5" min="0" max="100" {...register("vatRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Montant TTC (calculé)</Label>
            <div className="h-9 px-3 flex items-center rounded-md border bg-muted font-semibold">
              {formatCurrency(amountTTC)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opérateur et commission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Opérateur & Commission</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Opérateur responsable *</Label>
            <Select defaultValue={defaultValues?.operatorId} onValueChange={handleOperatorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'opérateur..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.firstName} {op.lastName} ({op.commissionRate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.operatorId && <p className="text-xs text-destructive">{errors.operatorId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Prospect associé</Label>
            <Select defaultValue={defaultValues?.prospectId} onValueChange={(v) => setValue("prospectId", v === "NONE" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Aucun</SelectItem>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commissionRate">Taux de commission (%)</Label>
            <Input id="commissionRate" type="number" step="0.5" min="0" max="100" {...register("commissionRate", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Commission estimée</Label>
            <div className="h-9 px-3 flex items-center rounded-md border bg-emerald-50 text-emerald-700 font-bold">
              {formatCurrency(commissionAmount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commentaires */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="operatorComment">Commentaire visible par l&apos;opérateur</Label>
            <Textarea id="operatorComment" rows={3} placeholder="Message pour l'opérateur..." {...register("operatorComment")} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="internalComment">Commentaire interne (admin uniquement)</Label>
            <Textarea id="internalComment" rows={3} placeholder="Note confidentielle..." {...register("internalComment")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Mettre à jour" : "Créer le devis"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </form>
  );
}
