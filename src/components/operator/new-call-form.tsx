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
import { CALL_STATUS_LABELS, SECTORS, SERVICES } from "@/lib/utils";

const schema = z.object({
  companyName: z.string().min(1, "Nom de l'entreprise requis"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  sector: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  source: z.string().optional(),
  serviceNeeded: z.string().optional(),
  callSummary: z.string().optional(),
  interestLevel: z.number().min(1).max(5).optional(),
  status: z.string(),
  nextAction: z.string().optional(),
  callbackDate: z.string().optional(),
  comments: z.string().optional(),
  prospectId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const statuses = [
  "TO_CALL", "CALLED", "NO_ANSWER", "WRONG_NUMBER", "TO_CALLBACK",
  "NOT_INTERESTED", "INTERESTED", "MEETING_SCHEDULED", "QUOTE_REQUESTED",
  "QUOTE_IN_PROGRESS", "QUOTE_SENT", "QUOTE_SIGNED", "QUOTE_REFUSED",
  "LOST_CLIENT", "FINALIZED_CLIENT",
];

const sources = [
  "Liste fournie", "Recherche Google", "Pages Jaunes", "LinkedIn",
  "Recommandation", "Réseau personnel", "Appel entrant", "Autre",
];

interface Prospect {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
}

export function NewCallForm({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "CALLED" },
  });

  const status = watch("status");

  const handleProspectSelect = (id: string) => {
    if (id === "NEW") {
      setValue("prospectId", undefined);
      return;
    }
    const p = prospects.find(p => p.id === id);
    if (p) {
      setValue("prospectId", p.id);
      setValue("companyName", p.companyName);
      if (p.contactName) setValue("contactName", p.contactName);
      if (p.phone) setValue("phone", p.phone);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/operator/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'enregistrement");
        return;
      }

      toast.success("Appel enregistré avec succès !");
      router.push("/operator/calls");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Prospect existant */}
      {prospects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Associer à un prospect existant (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleProspectSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un prospect..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Nouveau contact</SelectItem>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Informations entreprise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations du contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
            <Input id="companyName" placeholder="Entreprise SAS" {...register("companyName")} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Nom du contact</Label>
            <Input id="contactName" placeholder="Jean Dupont" {...register("contactName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" placeholder="06 00 00 00 00" {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="contact@entreprise.fr" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Site internet actuel</Label>
            <Input id="website" placeholder="www.entreprise.fr" {...register("website")} />
          </div>
          <div className="space-y-1.5">
            <Label>Secteur d&apos;activité</Label>
            <Select onValueChange={(v) => setValue("sector", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" placeholder="Paris" {...register("city")} />
          </div>
          <div className="space-y-1.5">
            <Label>Origine du prospect</Label>
            <Select onValueChange={(v) => setValue("source", v)}>
              <SelectTrigger>
                <SelectValue placeholder="D'où vient ce contact ?" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service potentiel</Label>
            <Select onValueChange={(v) => setValue("serviceNeeded", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Service recherché..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Résultat de l'appel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Résultat de l&apos;appel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Statut de l&apos;appel *</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Niveau d&apos;intérêt (1-5)</Label>
              <Select onValueChange={(v) => setValue("interestLevel", parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Pas du tout intéressé</SelectItem>
                  <SelectItem value="2">2 — Peu intéressé</SelectItem>
                  <SelectItem value="3">3 — Neutre / À explorer</SelectItem>
                  <SelectItem value="4">4 — Intéressé</SelectItem>
                  <SelectItem value="5">5 — Très intéressé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callSummary">Résumé de l&apos;appel</Label>
            <Textarea
              id="callSummary"
              placeholder="Décrivez ce qui a été échangé lors de l'appel..."
              rows={3}
              {...register("callSummary")}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nextAction">Prochaine action</Label>
              <Input id="nextAction" placeholder="Ex: Envoyer une plaquette" {...register("nextAction")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callbackDate">Date de rappel</Label>
              <Input id="callbackDate" type="datetime-local" {...register("callbackDate")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
              placeholder="Notes supplémentaires..."
              rows={2}
              {...register("comments")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer l&apos;appel
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
