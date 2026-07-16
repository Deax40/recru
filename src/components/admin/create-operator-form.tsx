"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  identifier: z.string().min(3, "Identifiant minimum 3 caractères").regex(/^[a-zA-Z0-9._-]+$/, "Caractères alphanumériques uniquement"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  temporaryPassword: z.string().min(8, "Minimum 8 caractères"),
  commissionRate: z.number().min(0).max(100),
  mustChangePassword: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export function CreateOperatorForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [generatedPwd, setGeneratedPwd] = useState(generatePassword());

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      commissionRate: 30,
      mustChangePassword: true,
      temporaryPassword: generatedPwd,
    },
  });

  const regenerate = () => {
    const pwd = generatePassword();
    setGeneratedPwd(pwd);
    setValue("temporaryPassword", pwd);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(watch("temporaryPassword"));
    toast.success("Mot de passe copié !");
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la création");
        return;
      }

      toast.success("Opérateur créé avec succès !");
      router.push("/admin/operators");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" placeholder="Jean" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" placeholder="Dupont" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Identifiant de connexion *</Label>
            <Input
              id="identifier"
              placeholder="jean.dupont"
              className="font-mono"
              {...register("identifier")}
            />
            {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commissionRate">Taux de commission (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.5"
              min="0"
              max="100"
              {...register("commissionRate", { valueAsNumber: true })}
            />
            {errors.commissionRate && <p className="text-xs text-destructive">{errors.commissionRate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input id="email" type="email" placeholder="jean@exemple.fr" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input id="phone" placeholder="06 00 00 00 00" {...register("phone")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accès et sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="temporaryPassword">Mot de passe temporaire *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="temporaryPassword"
                  type={showPassword ? "text" : "password"}
                  className="font-mono pr-16"
                  {...register("temporaryPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={regenerate} title="Générer">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={copyPassword} title="Copier">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {errors.temporaryPassword && <p className="text-xs text-destructive">{errors.temporaryPassword.message}</p>}
            <p className="text-xs text-muted-foreground">
              Communiquez ce mot de passe à l&apos;opérateur par un canal sécurisé.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Forcer le changement de mot de passe</p>
              <p className="text-xs text-muted-foreground">
                L&apos;opérateur devra définir un nouveau mot de passe à sa première connexion
              </p>
            </div>
            <Switch
              defaultChecked
              onCheckedChange={(v) => setValue("mustChangePassword", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l&apos;opérateur
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
