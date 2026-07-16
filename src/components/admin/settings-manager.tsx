"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Setting {
  id: string;
  key: string;
  value: string;
  group: string;
  label: string | null;
}

export function SettingsManager({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  );
  const [loading, setLoading] = useState(false);

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {} as Record<string, Setting[]>);

  const groupLabels: Record<string, string> = {
    general: "Général",
    commission: "Commissions",
    ranking: "Classement",
    notifications: "Notifications",
    security: "Sécurité",
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success("Paramètres enregistrés !");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {Object.entries(grouped).map(([group, items]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{groupLabels[group] || group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((s, i) => {
              const isBool = values[s.key] === "true" || values[s.key] === "false";
              return (
                <div key={s.key}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className={isBool ? "flex items-center justify-between" : "space-y-1.5"}>
                    <Label htmlFor={s.key}>{s.label || s.key}</Label>
                    {isBool ? (
                      <Switch
                        checked={values[s.key] === "true"}
                        onCheckedChange={(v) => setValues(prev => ({ ...prev, [s.key]: String(v) }))}
                      />
                    ) : (
                      <Input
                        id={s.key}
                        value={values[s.key] || ""}
                        onChange={(e) => setValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {settings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Aucun paramètre configuré
          </CardContent>
        </Card>
      )}

      {settings.length > 0 && (
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer les paramètres
        </Button>
      )}
    </div>
  );
}
