"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime, formatPercent } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const profileSchema = z.object({
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Requis"),
  newPassword: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  commissionRate: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  role: string;
}

export function ProfileForm({ user }: { user: User }) {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: errProfile } } =
    useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema),
      defaultValues: { email: user.email || "", phone: user.phone || "" },
    });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: errPwd } } =
    useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/operator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoadingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoadingPassword(true);
    try {
      const res = await fetch("/api/operator/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur");
        return;
      }
      toast.success("Mot de passe modifié !");
      resetPwd();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-muted-foreground">@{user.identifier}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>Membre depuis {formatDate(user.createdAt)}</span>
              <span>•</span>
              <span>Dernière connexion : {formatDateTime(user.lastLoginAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Taux de commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-emerald-600">{formatPercent(user.commissionRate)}</div>
            <p className="text-sm text-muted-foreground">
              du montant HT encaissé par le client — calculé et validé par l&apos;administrateur.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Mes informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input value={user.firstName} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={user.lastName} disabled className="bg-muted" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Identifiant</Label>
              <Input value={user.identifier} disabled className="bg-muted font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="votre@email.com" className="pl-9" {...regProfile("email")} />
              </div>
              {errProfile.email && <p className="text-xs text-destructive">{errProfile.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" placeholder="06 00 00 00 00" className="pl-9" {...regProfile("phone")} />
              </div>
            </div>
            <Button type="submit" disabled={loadingProfile}>
              {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input id="currentPassword" type="password" {...regPwd("currentPassword")} />
              {errPwd.currentPassword && <p className="text-xs text-destructive">{errPwd.currentPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" type="password" {...regPwd("newPassword")} />
              {errPwd.newPassword && <p className="text-xs text-destructive">{errPwd.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer</Label>
              <Input id="confirmPassword" type="password" {...regPwd("confirmPassword")} />
              {errPwd.confirmPassword && <p className="text-xs text-destructive">{errPwd.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={loadingPassword}>
              {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
