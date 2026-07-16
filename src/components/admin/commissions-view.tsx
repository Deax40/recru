"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, formatCurrency, formatPercent, COMMISSION_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, DollarSign, Edit } from "lucide-react";

interface Commission {
  id: string;
  baseAmount: number;
  rate: number;
  amount: number;
  status: string;
  scheduledAt: Date | null;
  paidAt: Date | null;
  comment: string | null;
  operator: { id: string; firstName: string; lastName: string };
  quote: { quoteNumber: string; clientName: string; service: string; amountHT: number; amountReceived: number | null };
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
}

const allStatuses = [
  "ESTIMATION", "WAITING_SIGNATURE", "WAITING_PAYMENT", "TO_VALIDATE",
  "VALIDATED", "PAYMENT_SCHEDULED", "PAID", "CANCELLED", "SUSPENDED",
];

export function AdminCommissionsView({
  commissions,
  operators,
}: {
  commissions: Commission[];
  operators: Operator[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterOp, setFilterOp] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = commissions.filter((c) => {
    if (filterOp !== "ALL" && c.operator.id !== filterOp) return false;
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    return true;
  });

  const quickValidate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/commissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "PAID" ? "Commission marquée comme payée !" : "Commission validée !");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    }
  };

  const editing = editingId ? commissions.find(c => c.id === editingId) : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterOp} onValueChange={(v) => setFilterOp(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tous les opérateurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les opérateurs</SelectItem>
            {operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>{op.firstName} {op.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>{COMMISSION_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Aucune commission trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client / Devis</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Base HT</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Taux</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payée le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.operator.firstName} {c.operator.lastName}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.quote.clientName}</p>
                    <p className="text-xs text-muted-foreground">{c.quote.quoteNumber}</p>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(c.baseAmount)}</td>
                  <td className="px-4 py-3 font-semibold text-muted-foreground">{formatPercent(c.rate)}</td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(c.amount)}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge type="commission" status={c.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.paidAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === "TO_VALIDATE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => quickValidate(c.id, "VALIDATED")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valider
                        </Button>
                      )}
                      {c.status === "VALIDATED" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => quickValidate(c.id, "PAID")}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Payer
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingId(c.id)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{c.operator.firstName} {c.operator.lastName}</p>
                  <p className="text-sm text-muted-foreground">{c.quote.clientName}</p>
                </div>
                <StatusBadge type="commission" status={c.status} />
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(c.amount)}</p>
                  <p className="text-xs text-muted-foreground">({formatPercent(c.rate)} de {formatCurrency(c.baseAmount)})</p>
                </div>
                <div className="flex gap-2">
                  {c.status === "TO_VALIDATE" && (
                    <Button size="sm" variant="outline" onClick={() => quickValidate(c.id, "VALIDATED")}>
                      Valider
                    </Button>
                  )}
                  {c.status === "VALIDATED" && (
                    <Button size="sm" onClick={() => quickValidate(c.id, "PAID")}>
                      Payer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <CommissionEditDialog
        commission={editing || null}
        onClose={() => setEditingId(null)}
        onSaved={() => {
          setEditingId(null);
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}

function CommissionEditDialog({
  commission,
  onClose,
  onSaved,
}: {
  commission: Commission | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(commission?.status || "");
  const [rate, setRate] = useState(String(commission?.rate || 30));
  const [paidAt, setPaidAt] = useState(commission?.paidAt ? new Date(commission.paidAt).toISOString().split("T")[0] : "");
  const [comment, setComment] = useState(commission?.comment || "");

  if (!commission) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const newAmount = commission.baseAmount * (parseFloat(rate) / 100);
      const res = await fetch(`/api/admin/commissions/${commission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rate: parseFloat(rate),
          amount: newAmount,
          paidAt: paidAt || null,
          comment,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Commission mise à jour !");
      onSaved();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!commission} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la commission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{commission.operator.firstName} {commission.operator.lastName}</p>
            <p className="font-medium">{commission.quote.clientName}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{COMMISSION_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Taux (%)</Label>
            <Input type="number" step="0.5" min="0" max="100" value={rate} onChange={(e) => setRate(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Nouveau montant : {formatCurrency(commission.baseAmount * (parseFloat(rate) / 100))}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Date de paiement</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Commentaire</Label>
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Raison de la modification..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
