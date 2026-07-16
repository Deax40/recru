"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ImportLog {
  id: string;
  status: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errorReport: string | null;
  createdAt: Date;
}

export function ImportExportManager({
  operators,
  importLogs,
}: {
  operators: { id: string; firstName: string; lastName: string }[];
  importLogs: ImportLog[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOp, setSelectedOp] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async (type: "prospects" | "calls" | "commissions") => {
    try {
      const params = new URLSearchParams({ type });
      if (selectedOp) params.set("operatorId", selectedOp);
      const res = await fetch(`/api/admin/export?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deax-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé !");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleImport = async (file: File) => {
    if (!selectedOp) { toast.error("Sélectionnez un opérateur"); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("operatorId", selectedOp);
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Import terminé : ${result.successRows} lignes importées`);
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1.5">
        <Label>Opérateur (pour l'import et les exports filtrés)</Label>
        <Select value={selectedOp} onValueChange={setSelectedOp}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Tous les opérateurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les opérateurs</SelectItem>
            {operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>{op.firstName} {op.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              Exporter les données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("prospects")}>
              <FileText className="mr-2 h-4 w-4" />
              Prospects (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("calls")}>
              <FileText className="mr-2 h-4 w-4" />
              Appels (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("commissions")}>
              <FileText className="mr-2 h-4 w-4" />
              Commissions (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-500" />
              Importer des prospects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Importez un fichier CSV avec les colonnes : companyName, contactName, phone, email, sector, city, website
            </p>
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept=".csv"
              onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); }}
            />
            <Button
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={importing || !selectedOp}
            >
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {importing ? "Import en cours..." : "Choisir un fichier CSV"}
            </Button>
            {!selectedOp && (
              <p className="text-xs text-amber-600">Sélectionnez un opérateur avant d'importer</p>
            )}
          </CardContent>
        </Card>
      </div>

      {importLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des imports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fichier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opérateur</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Résultat</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{log.fileName || "—"}</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.status === "COMPLETED" ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : log.status === "FAILED" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                        <span className="text-xs">
                          {log.importedRows} OK / {log.errorRows} erreurs
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
