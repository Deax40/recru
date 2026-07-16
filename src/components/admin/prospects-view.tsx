"use client";

import { useState } from "react";
import { formatDate, PROSPECT_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Phone, Mail } from "lucide-react";

interface Prospect {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  sector: string | null;
  city: string | null;
  status: string;
  serviceNeeded: string | null;
  createdAt: Date;
  operator: { id: string; firstName: string; lastName: string } | null;
  _count: { calls: number; quotes: number };
}

const ALL_STATUSES = Object.keys(PROSPECT_STATUS_LABELS);

export function AdminProspectsView({
  prospects,
  operators,
}: {
  prospects: Prospect[];
  operators: { id: string; firstName: string; lastName: string }[];
}) {
  const [search, setSearch] = useState("");
  const [filterOp, setFilterOp] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = prospects.filter((p) => {
    if (filterOp !== "ALL" && p.operator?.id !== filterOp) return false;
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.companyName.toLowerCase().includes(q) ||
        p.contactName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterOp} onValueChange={setFilterOp}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Opérateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les opérateurs</SelectItem>
            {operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>{op.firstName} {op.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PROSPECT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} prospect(s)</p>

      {/* Desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entreprise</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activité</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">Aucun prospect trouvé</td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.companyName}</p>
                  {p.sector && <p className="text-xs text-muted-foreground">{p.sector}</p>}
                </td>
                <td className="px-4 py-3">
                  <p>{p.contactName || "—"}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {p.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{p.phone}</span>}
                    {p.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{p.email}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {p.operator ? `${p.operator.firstName} ${p.operator.lastName}` : "—"}
                </td>
                <td className="px-4 py-3"><StatusBadge type="prospect" status={p.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {p._count.calls} appel(s) · {p._count.quotes} devis
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{p.companyName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.contactName}</p>
                </div>
                <StatusBadge type="prospect" status={p.status} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {p.operator && <span>{p.operator.firstName} {p.operator.lastName}</span>}
                {p.sector && <span>{p.sector}</span>}
                <span>{p._count.calls} appel(s)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
