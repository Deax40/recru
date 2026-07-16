"use client";

import { useState } from "react";
import { formatDate, CALL_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone } from "lucide-react";

interface Call {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  sector: string | null;
  city: string | null;
  status: string;
  interestLevel: number | null;
  callSummary: string | null;
  callDate: Date;
  operator: { id: string; firstName: string; lastName: string };
}

const ALL_STATUSES = Object.keys(CALL_STATUS_LABELS);

export function AdminCallsView({ calls, operators }: { calls: Call[]; operators: { id: string; firstName: string; lastName: string }[] }) {
  const [search, setSearch] = useState("");
  const [filterOp, setFilterOp] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = calls.filter((c) => {
    if (filterOp !== "ALL" && c.operator.id !== filterOp) return false;
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.contactName?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
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
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterOp} onValueChange={(v) => setFilterOp(v ?? "ALL")}>
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
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} appel(s)</p>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entreprise</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">Aucun appel trouvé</td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.companyName}</p>
                  {c.sector && <p className="text-xs text-muted-foreground">{c.sector}</p>}
                </td>
                <td className="px-4 py-3">
                  <p>{c.contactName || "—"}</p>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </td>
                <td className="px-4 py-3">{c.operator.firstName} {c.operator.lastName}</td>
                <td className="px-4 py-3"><StatusBadge type="call" status={c.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.callDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.companyName}</p>
                  <p className="text-sm text-muted-foreground">{c.contactName}</p>
                </div>
                <StatusBadge type="call" status={c.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{c.operator.firstName} {c.operator.lastName}</span>
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />{c.phone}
                  </span>
                )}
                <span>{formatDate(c.callDate)}</span>
              </div>
              {c.callSummary && (
                <p className="text-sm text-muted-foreground line-clamp-2">{c.callSummary}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
