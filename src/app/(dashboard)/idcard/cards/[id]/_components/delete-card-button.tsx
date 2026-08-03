"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/**
 * Hapus kartu PERMANEN -- backend (idcard/api_views.py::
 * IDCardDetailView.delete()) SEKALIAN membersihkan file fisik (foto
 * sumber & hasil kartu) dari storage, TIDAK ada file yatim yang
 * tersisa. STAFF-ONLY (endpoint DELETE-nya ditolak utk portal) --
 * makanya tombol ini CUMA ada di halaman detail staff, TIDAK di portal.
 */
export function DeleteCardButton({ cardId, holderName }: { cardId: number; holderName: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await request(`/idcard/cards/${cardId}/`, { method: "DELETE" });
      router.push("/idcard/cards");
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus kartu."));
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" /> Hapus
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kartu?</DialogTitle>
            <DialogDescription>
              Kartu untuk &quot;{holderName}&quot; akan dihapus permanen, termasuk file foto dan gambar kartu di server. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
