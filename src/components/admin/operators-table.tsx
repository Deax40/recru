"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate, formatDateTime, formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { MoreVertical, Edit, UserX, UserCheck, Trash2, Eye } from "lucide-react";

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  status: string;
  commissionRate: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: { calls: number; prospects: number; quotes: number; commissions: number };
}

export function OperatorsTable({ operators }: { operators: Operator[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/operators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "ACTIVE" ? "Opérateur réactivé" : "Opérateur suspendu");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    }
  };

  const deleteOperator = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/operators/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Opérateur supprimé");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Identifiant</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activité</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dernière connexion</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {operators.map((op) => (
              <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {op.firstName[0]}{op.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{op.firstName} {op.lastName}</p>
                      {op.email && <p className="text-xs text-muted-foreground">{op.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{op.identifier}</td>
                <td className="px-4 py-3">
                  <Badge variant={op.status === "ACTIVE" ? "default" : op.status === "SUSPENDED" ? "destructive" : "secondary"}>
                    {op.status === "ACTIVE" ? "Actif" : op.status === "SUSPENDED" ? "Suspendu" : "En attente"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{formatPercent(op.commissionRate)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {op._count.calls} appels • {op._count.prospects} prospects • {op._count.quotes} devis
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {op.lastLoginAt ? formatDateTime(op.lastLoginAt) : "Jamais"}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/operators/${op.id}`}>
                          <Eye className="h-4 w-4 mr-2" /> Voir le profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/operators/${op.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" /> Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {op.status === "ACTIVE" ? (
                        <DropdownMenuItem
                          className="text-amber-600"
                          onClick={() => updateStatus(op.id, "SUSPENDED")}
                        >
                          <UserX className="h-4 w-4 mr-2" /> Suspendre
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-emerald-600"
                          onClick={() => updateStatus(op.id, "ACTIVE")}
                        >
                          <UserCheck className="h-4 w-4 mr-2" /> Réactiver
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(op.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {operators.map((op) => (
          <Card key={op.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {op.firstName[0]}{op.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{op.firstName} {op.lastName}</p>
                  <p className="text-xs text-muted-foreground">@{op.identifier}</p>
                </div>
                <Badge variant={op.status === "ACTIVE" ? "default" : "destructive"}>
                  {op.status === "ACTIVE" ? "Actif" : "Suspendu"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href={`/admin/operators/${op.id}`}>Voir</Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href={`/admin/operators/${op.id}/edit`}>Modifier</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet opérateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de l&apos;opérateur seront conservées mais son compte sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOperator} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
