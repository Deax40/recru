"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  version: z.string().default("1.0"),
  categoryId: z.string().optional(),
  isMandatory: z.boolean().default(false),
  status: z.string().default("PUBLISHED"),
});

type FormData = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  version: string;
  status: string;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: Category | null;
  _count: { reads: number };
}

export function AdminDocumentsManager({
  categories,
  documents,
}: {
  categories: Category[];
  documents: Document[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: "PUBLISHED", isMandatory: false, version: "1.0" },
  });

  const openCreate = () => {
    reset({ status: "PUBLISHED", isMandatory: false, version: "1.0" });
    setEditingDoc(null);
    setDialogOpen(true);
  };

  const openEdit = (doc: Document) => {
    reset({
      title: doc.title,
      description: doc.description || "",
      version: doc.version,
      categoryId: doc.category?.id,
      isMandatory: doc.isMandatory,
      status: doc.status,
    });
    setEditingDoc(doc);
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = editingDoc ? `/api/admin/documents/${editingDoc.id}` : "/api/admin/documents";
      const method = editingDoc ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success(editingDoc ? "Document mis à jour !" : "Document créé !");
      setDialogOpen(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
      toast.success("Supprimé");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Document</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Version</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lectures</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mis à jour</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      {doc.description && <p className="text-xs text-muted-foreground">{doc.description.slice(0, 60)}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{doc.category?.name || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{doc.version}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={doc.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                      {doc.status === "PUBLISHED" ? "Publié" : doc.status === "DRAFT" ? "Brouillon" : "Archivé"}
                    </Badge>
                    {doc.isMandatory && (
                      <Badge className="bg-red-100 text-red-700 text-xs">Obligatoire</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{doc._count.reads}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDoc(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun document
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Modifier le document" : "Ajouter un document"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select defaultValue={editingDoc?.category?.id} onValueChange={(v) => setValue("categoryId", v === "NONE" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sans catégorie</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="version">Version</Label>
                <Input id="version" {...register("version")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Publié</Label>
                <Switch
                  defaultChecked={editingDoc ? editingDoc.status === "PUBLISHED" : true}
                  onCheckedChange={(v) => setValue("status", v ? "PUBLISHED" : "DRAFT")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Obligatoire</Label>
                <Switch
                  defaultChecked={editingDoc?.isMandatory ?? false}
                  onCheckedChange={(v) => setValue("isMandatory", v)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDoc ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
