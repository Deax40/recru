"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, QUOTE_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, ChevronLeft, ChevronRight, Eye, Edit } from "lucide-react";

const ALL_QUOTE_STATUSES = [
  "INFO_TO_COMPLETE", "IN_PREPARATION", "SENT", "WAITING_RESPONSE",
  "FOLLOW_UP_NEEDED", "ACCEPTED", "SIGNED", "DEPOSIT_RECEIVED",
  "PARTIALLY_PAID", "FULLY_PAID", "REFUSED", "CANCELLED", "EXPIRED",
];

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  service: string;
  amountHT: number;
  amountTTC: number;
  status: string;
  sentAt: Date | null;
  amountReceived: number | null;
  operator: { firstName: string; lastName: string };
  commission: { amount: number; status: string } | null;
}

interface Props {
  quotes: Quote[];
  total: number;
  page: number;
  search: string;
  filter: string;
  limit: number;
}

export function AdminQuotesTable({ quotes, total, page, search, filter, limit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const totalPages = Math.ceil(total / limit);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (filter) params.set("filter", filter);
    params.set("page", "1");
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher client, numéro, prestation..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateParams({ search: searchValue })}
              className="pl-9"
            />
          </div>
          <Button onClick={() => updateParams({ search: searchValue })} disabled={isPending}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filter || "ALL"} onValueChange={(v) => updateParams({ status: v === "ALL" ? "" : v })}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {ALL_QUOTE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/admin/quotes/new">+ Nouveau devis</Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun devis trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Devis</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prestation</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant HT</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{q.quoteNumber}</td>
                    <td className="px-4 py-3 font-medium">{q.clientName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{q.service}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(q.amountHT)}</td>
                    <td className="px-4 py-3"><StatusBadge type="quote" status={q.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {q.operator.firstName} {q.operator.lastName}
                    </td>
                    <td className="px-4 py-3">
                      {q.commission ? (
                        <div>
                          <span className="font-medium text-emerald-600">{formatCurrency(q.commission.amount)}</span>
                          <div className="mt-0.5"><StatusBadge type="commission" status={q.commission.status} /></div>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/admin/quotes/${q.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/admin/quotes/${q.id}/edit`}><Edit className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {quotes.map((q) => (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{q.quoteNumber}</p>
                      <p className="font-semibold">{q.clientName}</p>
                      <p className="text-sm text-muted-foreground">{q.service}</p>
                    </div>
                    <StatusBadge type="quote" status={q.status} />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-lg">{formatCurrency(q.amountHT)}</p>
                      <p className="text-xs text-muted-foreground">{q.operator.firstName} {q.operator.lastName}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                      <Link href={`/admin/quotes/${q.id}/edit`}>Modifier</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} sur {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (search) p.set("search", search);
                    if (filter) p.set("status", filter);
                    p.set("page", String(page - 1));
                    router.push(`${pathname}?${p.toString()}`);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (search) p.set("search", search);
                    if (filter) p.set("status", filter);
                    p.set("page", String(page + 1));
                    router.push(`${pathname}?${p.toString()}`);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
