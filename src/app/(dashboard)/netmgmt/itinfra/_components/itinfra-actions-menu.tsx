"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { ITInfraCategory, ITInfraEntrySummary } from "@/types/api";
import { ItInfraFormDialog } from "./itinfra-form-dialog";

export function ItInfraActionsMenu({ entry, categories }: { entry: ITInfraEntrySummary; categories: ITInfraCategory[] }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await request("/netmgmt/itinfra/entries/action/", {
        method: "POST",
        body: JSON.stringify({ action: "delete", entry_id: entry.id }),
      });
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus data."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-0.5">
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Hapus">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ItInfraFormDialog mode="edit" entryId={entry.id} categories={categories} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Data?</DialogTitle>
            <DialogDescription>
              Data <span className="font-medium text-foreground">{entry.name}</span> ({entry.category_name}) akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
