"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient, ApiError } from "@/lib/api-client";
import type { MobilePool } from "@/types/api";

const emptyForm = { PoolID: "", PoolCode: "", PoolName: "", Latitude: "", Longitude: "", Radius: "" };

export function MobilePoolFormDialog({ mode, pool }: { mode: "create" | "edit"; pool?: MobilePool }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && pool) {
      setForm({
        PoolID: pool.PoolID, PoolCode: pool.PoolCode ?? "", PoolName: pool.PoolName ?? "",
        Latitude: pool.Latitude ?? "", Longitude: pool.Longitude ?? "", Radius: pool.Radius !== null ? String(pool.Radius) : "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { ...form, Radius: form.Radius ? Number(form.Radius) : null };
    try {
      if (mode === "create") {
        await request("/mclock/mobile-pool/", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await request(`/mclock/mobile-pool/${pool!.PoolID}/`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[]> | null;
        setError(body ? Object.values(body).flat().join(" ") : "Gagal menyimpan.");
      } else {
        setError("Gagal menyimpan.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah Pool (Testing)</Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Mobile Pool" : `Edit Pool — ${pool?.PoolID}`}</DialogTitle>
          <DialogDescription>
            🧪 Data ini disinkronkan dari MSSQL eksternal -- perubahan lewat sini murni utk testing,
            akan tertimpa saat sync berikutnya jalan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="poolid">Pool ID</Label>
              <Input id="poolid" value={form.PoolID} disabled={mode === "edit"} required className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, PoolID: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="poolcode">Pool Code</Label>
              <Input id="poolcode" value={form.PoolCode} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, PoolCode: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="poolname">Nama Pool</Label>
            <Input id="poolname" value={form.PoolName}
              onChange={(e) => setForm((f) => ({ ...f, PoolName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" value={form.Latitude} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, Latitude: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" value={form.Longitude} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, Longitude: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius">Radius (m)</Label>
              <Input id="radius" type="number" value={form.Radius}
                onChange={(e) => setForm((f) => ({ ...f, Radius: e.target.value }))} />
            </div>
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
