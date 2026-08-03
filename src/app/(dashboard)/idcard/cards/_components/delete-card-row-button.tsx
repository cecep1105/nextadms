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
 * Versi ICON-ONLY dari DeleteCardButton (halaman detail) -- dipakai di
 * baris tabel Daftar Kartu, cukup refresh list SETELAH hapus (BUKAN
 * navigasi ke halaman lain).
 */
export function DeleteCardRowButton({ cardId, holderName }: { cardId: number; holderName: string }) {
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
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus kartu."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Hapus">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kartu?</DialogTitle>
            <DialogDescription>
              Kartu untuk &quot;{holderName}&quot; akan dihapus permanen, termasuk file foto dan gambar kartu di server.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
