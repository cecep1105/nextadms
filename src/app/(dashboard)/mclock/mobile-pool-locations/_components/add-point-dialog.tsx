"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { MobilePool } from "@/types/api";

/**
 * Tambah 1 titik polygon SECARA MANUAL (form biasa, bukan klik di peta) --
 * pelengkap "Gambar Polygon di Peta" utk kasus input cepat/presisi (mis.
 * copy-paste koordinat GPS eksak dari sumber lain). Sama seperti Mobile
 * Pool, data di tabel ini SEWAKTU-WAKTU tertimpa sync MSSQL eksternal --
 * dipakai buat data testing/seed sebelum sync sungguhan berjalan.
 */
export function AddPointDialog({ pools }: { pools: MobilePool[] }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ PoolID: "", Urut: "", Latitude: "", Longitude: "" });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setForm({ PoolID: "", Urut: "", Latitude: "", Longitude: "" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/mclock/mobile-pool-loc/", {
        method: "POST",
        body: JSON.stringify({
          PoolID: form.PoolID,
          Urut: form.Urut,
          Latitude: form.Latitude,
          Longitude: form.Longitude,
        }),
      });
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menambah titik. Kombinasi Pool + Urut mungkin sudah ada."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Tambah Titik Manual
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Titik Polygon</DialogTitle>
          <DialogDescription>
            Input manual 1 titik -- utk gambar seluruh polygon sekaligus, pakai &quot;Gambar Polygon Baru&quot; di peta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label>Pool</Label>
            <Select value={form.PoolID} onValueChange={(v) => setForm((f) => ({ ...f, PoolID: v }))}>
              <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
              <SelectContent>
                {pools.map((p) => (
                  <SelectItem key={p.PoolID} value={p.PoolID}>{p.PoolName ?? p.PoolID} ({p.PoolID})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="urut">Urutan Titik</Label>
            <Input id="urut" type="number" step="1" min="1" required value={form.Urut}
              onChange={(e) => setForm((f) => ({ ...f, Urut: e.target.value }))}
              placeholder="Urutan keliling polygon, mis. 1, 2, 3..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" required value={form.Latitude} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, Latitude: e.target.value }))} placeholder="-6.123456" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" required value={form.Longitude} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, Longitude: e.target.value }))} placeholder="106.123456" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={loading || !form.PoolID}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
