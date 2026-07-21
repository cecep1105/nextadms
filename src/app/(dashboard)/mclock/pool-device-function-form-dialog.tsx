"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient, ApiError } from "@/lib/api-client";
import type { PoolDeviceFunction } from "@/types/api";

export function PoolDeviceFunctionFormDialog({
  mode, item,
}: {
  mode: "create" | "edit";
  item?: PoolDeviceFunction;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    PoolID: item?.PoolID ?? "",
    function_type: item?.function_type ?? "BUKAN_KANTIN",
  });

  useEffect(() => {
    if (!open) return;
    setForm({ PoolID: item?.PoolID ?? "", function_type: item?.function_type ?? "BUKAN_KANTIN" });
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "create") {
        await request("/mclock/pool-device-function/", { method: "POST", body: JSON.stringify(form) });
      } else {
        await request(`/mclock/pool-device-function/${item!.id}/`, { method: "PATCH", body: JSON.stringify(form) });
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
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah Mapping</Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      )}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Pool Device Function" : `Edit Mapping — ${item?.PoolID}`}</DialogTitle>
          <DialogDescription>
            Menentukan apakah PoolID ini KANTIN atau bukan -- dipakai <code>mattendance</code> menentukan
            kode fungsi check-in/out/meal (prioritas pertama, sebelum fallback ke prefix PIN).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <div className="space-y-1.5">
            <Label htmlFor="poolid">Pool ID</Label>
            <Input id="poolid" value={form.PoolID} disabled={mode === "edit"} required className="font-mono"
              onChange={(e) => setForm((f) => ({ ...f, PoolID: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Function Type</Label>
            <Select value={form.function_type} onValueChange={(v) => setForm((f) => ({ ...f, function_type: v as "KANTIN" | "BUKAN_KANTIN" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KANTIN">KANTIN</SelectItem>
                <SelectItem value="BUKAN_KANTIN">Bukan KANTIN</SelectItem>
              </SelectContent>
            </Select>
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
