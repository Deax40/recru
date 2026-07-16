"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { CALL_STATUS_LABELS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, ChevronLeft, ChevronRight, Eye, Edit } from "lucide-react";

const ALL_STATUSES = [
  "TO_CALL", "CALLED", "NO_ANSWER", "WRONG_NUMBER", "TO_CALLBACK",
  "NOT_INTERESTED", "INTERESTED", "MEETING_SCHEDULED", "QUOTE_REQUESTED",
  "QUOTE_IN_PROGRESS", "QUOTE_SENT", "QUOTE_SIGNED", "QUOTE_REFUSED",
  "LOST_CLIENT", "FINALIZED_CLIENT",
];

interface Call {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  status: string;
  interestLevel: number | null;
  callDate: Date;
  callbackDate: Date | null;
  isLocked: boolean;
}

interface CallsTableProps {
  calls: Call[];
  total: number;
  page: number;
  search: string;
  filter: string;
  limit: number;
}

export function CallsTable({ calls, total, page, search, filter, limit }: CallsTableProps) {
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

  const handleSearch = () => updateParams({ search: searchValue, page: "1" });
  const handleFilter = (val: string) => updateParams({ filter: val === "ALL" ? "" : val });
  const handlePage = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter) params.set("filter", filter);
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher entreprise, contact, téléphone..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={isPending}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filter || "ALL"} onValueChange={handleFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CALL_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/operator/calls/new">+ Nouvel appel</Link>
        </Button>
      </div>

      {/* Table / Cards */}
      {calls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun appel trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par enregistrer votre premier appel.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/operator/calls/new">Enregistrer un appel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entreprise</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Téléphone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rappel</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{call.companyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{call.contactName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{call.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="call" status={call.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(call.callDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {call.callbackDate ? (
                        <span className="text-amber-600 font-medium">{formatDateTime(call.callbackDate)}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/operator/calls/${call.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {!call.isLocked && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/operator/calls/${call.id}/edit`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {calls.map((call) => (
              <Card key={call.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{call.companyName}</p>
                      {call.contactName && (
                        <p className="text-sm text-muted-foreground">{call.contactName}</p>
                      )}
                    </div>
                    <StatusBadge type="call" status={call.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(call.callDate)}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/operator/calls/${call.id}`}>Voir</Link>
                      </Button>
                      {!call.isLocked && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/operator/calls/${call.id}/edit`}>Modifier</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} sur {total} appels
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePage(page + 1)}
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
