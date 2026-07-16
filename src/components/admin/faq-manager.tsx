"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const FAQ_CATEGORIES = [
  "Démarrage", "Prospection", "Appels", "Prospects", "Devis",
  "Commissions", "Paiements", "Utilisation du CRM",
  "Problèmes techniques", "Règles internes",
];

const schema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
  category: z.string().min(1),
  isPublished: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
  order: number;
}

export function AdminFAQManager({ faqs: initialFaqs }: { faqs: FAQ[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPublished: true },
  });

  const openCreate = () => {
    reset({ isPublished: true });
    setEditingFaq(null);
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isPublished: faq.isPublished,
    });
    setEditingFaq(faq);
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = editingFaq ? `/api/admin/faq/${editingFaq.id}` : "/api/admin/faq";
      const method = editingFaq ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error();
      toast.success(editingFaq ? "Question mise à jour !" : "Question créée !");
      setDialogOpen(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      toast.success("Question supprimée");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur");
    }
  };

  const grouped = initialFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold">{cat}</h3>
            </div>
            <div className="divide-y">
              {items.map((faq) => (
                <div key={faq.id} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{faq.question}</p>
                      {!faq.isPublished && (
                        <Badge variant="secondary" className="text-xs">Masquée</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(faq)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteFaq(faq.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {initialFaqs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Aucune question — cliquez sur &ldquo;Ajouter une question&rdquo;
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                defaultValue={editingFaq?.category}
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">Requis</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="question">Question</Label>
              <Input id="question" {...register("question")} />
              {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="answer">Réponse</Label>
              <Textarea id="answer" rows={5} {...register("answer")} />
              {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label>Publier</Label>
              <Switch
                defaultChecked={editingFaq?.isPublished ?? true}
                onCheckedChange={(v) => setValue("isPublished", v)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingFaq ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
