"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
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
import type { RegisteredDevice, Department } from "@/types/api";

export function RegisteredDeviceFormDialog({
  device, departments,
}: {
  device: RegisteredDevice;
  departments: Department[];
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    DeviceName: device.DeviceName ?? "",
    DeptID: device.DeptID ? String(device.DeptID) : "0",
    Function: device.Function ?? "0",
    IPRouter: device.IPRouter ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        DeviceName: device.DeviceName ?? "",
        DeptID: device.DeptID ? String(device.DeptID) : "0",
        Function: device.Function ?? "0",
        IPRouter: device.IPRouter ?? "",
      });
      setError(null);
      setSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await request<{ activated_to_active_device: boolean }>(
        `/iclock/registered-device/${device.id}/`,
        { method: "PATCH", body: JSON.stringify({ ...form, DeptID: Number(form.DeptID) }) }
      );
      if (result.activated_to_active_device) {
        setSuccess(`Device diaktivasi ke Active Device (Pool ID berubah dari 0). Cek halaman Active Device.`);
        router.refresh();
      } else {
        setOpen(false);
        router.refresh();
      }
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
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Konfigurasi Registered Device — {device.SN}</DialogTitle>
          <DialogDescription>
            Set Pool &amp; Function device ini. Mengubah Pool dari 0 (guest) ke pool lain akan
            OTOMATIS mengaktivasi device ke Active Device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          {success && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{success}</div>}

          <div className="space-y-1.5">
            <Label htmlFor="devicename">Nama Device</Label>
            <Input id="devicename" value={form.DeviceName}
              onChange={(e) => setForm((f) => ({ ...f, DeviceName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pool</Label>
              <Select value={form.DeptID} onValueChange={(v) => setForm((f) => ({ ...f, DeptID: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — Belum diaktivasi (guest)</SelectItem>
                  {departments.filter((d) => d.DeptID !== 0).map((d) => (
                    <SelectItem key={d.DeptID} value={String(d.DeptID)}>{d.DeptName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="function">Function Code</Label>
              <Input id="function" value={form.Function}
                onChange={(e) => setForm((f) => ({ ...f, Function: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iprouter">IP Router</Label>
            <Input id="iprouter" value={form.IPRouter} className="font-mono"
              onChange={(e) => setForm((f) => ({ ...f, IPRouter: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
