"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export function DocumentViewButton({
  documentId,
  isRead,
  isMandatory,
}: {
  documentId: string;
  isRead: boolean;
  isMandatory: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const markRead = async () => {
    try {
      await fetch(`/api/operator/documents/${documentId}/read`, { method: "POST" });
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur");
    }
  };

  const handleView = async () => {
    setLoading(true);
    await fetch(`/api/operator/documents/${documentId}/read`, { method: "POST" });
    setLoading(false);
    if (isMandatory && !isRead) {
      setConfirmOpen(true);
    } else {
      router.refresh();
    }
    toast.success("Document marqué comme lu");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={handleView}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
        Consulter
      </Button>

      {isMandatory && !isRead && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmation de lecture</DialogTitle>
              <DialogDescription>
                Ce document est obligatoire. En confirmant, vous attestez l&apos;avoir lu et compris.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Button>
              <Button onClick={markRead}>Confirmer la lecture</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
