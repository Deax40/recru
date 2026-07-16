import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Recall {
  id: string;
  companyName: string;
  callbackDate: Date | null;
}

export function RecallWidget({ recalls }: { recalls: Recall[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Rappels prévus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recalls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucun rappel prévu
          </p>
        ) : (
          <ul className="space-y-2">
            {recalls.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.companyName}</p>
                  <p className="text-xs text-amber-600">{formatDateTime(r.callbackDate)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" className="w-full mt-3" asChild>
          <Link href="/operator/calls?filter=TO_CALLBACK">
            Voir tous les rappels
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
