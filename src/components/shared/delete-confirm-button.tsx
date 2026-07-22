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

export function DeleteConfirmButton({
  endpoint, label, disabled, disabledReason,
}: {
  /** Path lengkap endpoint DELETE, mis. `/iclock/device-user/42/` */
  endpoint: string;
  /** Deskripsi entitas yang ditampilkan di dialog konfirmasi, mis. "Employee '008113009 — Budi'" */
  label: string;
  /** Nonaktifkan tombol (mis. bukan superuser, atau baris ini akun sendiri) -- backend AKAN tetap menolak, tapi ini kasih feedback LEBIH CEPAT (tanpa round-trip) & MENCEGAH klik yang pasti gagal. */
  disabled?: boolean;
  /** Alasan disabled, ditampilkan sbg deskripsi tombol (tooltip via title attr, cukup utk kasus ini). */
  disabledReason?: string;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await request(endpoint, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus data."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <Button
        variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Hapus"
        disabled={disabled} title={disabled ? disabledReason : undefined}
        className="text-destructive hover:text-destructive disabled:text-muted-foreground"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus data?</DialogTitle>
          <DialogDescription>
            {label} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
