"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardTemplate } from "@/types/api";

export function TemplateActionsMenu({ template }: { template: IDCardTemplate }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleToggleActive() {
    setLoading(true);
    try {
      await request(`/idcard/templates/${template.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !template.is_active }),
      });
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah status template."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await request(`/idcard/templates/${template.id}/`, { method: "DELETE" });
      setConfirmDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus template."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      <Button variant="ghost" size="icon" onClick={handleToggleActive} disabled={loading} aria-label={template.is_active ? "Nonaktifkan" : "Aktifkan"}>
        {template.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteOpen(true)} disabled={loading} aria-label="Hapus">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Template?</DialogTitle>
            <DialogDescription>
              Template &quot;{template.name}&quot; akan dihapus permanen. Kalau template ini sudah pernah dipakai generate kartu, penghapusan akan ditolak (nonaktifkan saja).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
