"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardStatus } from "@/types/api";

const STATUS_OPTIONS: { value: IDCardStatus; label: string }[] = [
  { value: "belum_cetak", label: "Belum Cetak" },
  { value: "sudah_cetak", label: "Sudah Cetak" },
  { value: "hilang", label: "Hilang" },
  { value: "cetak_ulang", label: "Cetak Ulang" },
];

export function ChangeStatusButton({ cardId, currentStatus }: { cardId: number; currentStatus: IDCardStatus }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<IDCardStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request(`/idcard/cards/${cardId}/status/`, {
        method: "POST",
        body: JSON.stringify({ status, notes }),
      });
      setOpen(false);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah status."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><RefreshCw className="h-3.5 w-3.5" /> Ubah Status</Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Status Kartu</DialogTitle>
          <DialogDescription>Perubahan akan tercatat di riwayat log kartu ini.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label>Status Baru</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as IDCardStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status-notes">Catatan (opsional)</Label>
            <Textarea id="status-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="mis. Dilaporkan hilang oleh karyawan" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
