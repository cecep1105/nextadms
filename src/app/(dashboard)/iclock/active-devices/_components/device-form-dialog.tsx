"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useApiClient, ApiError } from "@/lib/api-client";
import { useDeviceFunctionChoices } from "@/lib/use-device-function-choices";
import type { ActiveDevice, Department } from "@/types/api";

const emptyForm = {
  SN: "", Alias: "", DeptID: "", Function: "0", IPAddress: "", MAC: "", TZAdj: "7",
  ErrorDelay: "60", Delay: "30", TransTimes: "00:00;14:05", TransInterval: "1",
  UpdateDB: "1111111100", Realtime: true, Encrypt: false,
  LogStamp: "", OpLogStamp: "", PhotoStamp: "",
};

export function DeviceFormDialog({
  mode, device, departments,
}: {
  mode: "create" | "edit";
  device?: ActiveDevice;
  departments: Department[];
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const { choices: functionChoices } = useDeviceFunctionChoices();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && device) {
      setForm({
        SN: device.SN, Alias: device.Alias, DeptID: device.DeptID ? String(device.DeptID) : "",
        Function: device.Function ?? "0", IPAddress: device.IPAddress ?? "", MAC: device.MAC ?? "",
        TZAdj: device.TZAdj !== null ? String(device.TZAdj) : "7",
        ErrorDelay: String(device.ErrorDelay), Delay: String(device.Delay),
        TransTimes: device.TransTimes ?? "00:00;14:05", TransInterval: String(device.TransInterval),
        UpdateDB: device.UpdateDB, Realtime: device.Realtime, Encrypt: device.Encrypt,
        LogStamp: device.LogStamp ?? "", OpLogStamp: device.OpLogStamp ?? "", PhotoStamp: device.PhotoStamp ?? "",
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
    const payload = {
      ...form,
      DeptID: form.DeptID ? Number(form.DeptID) : null,
      TZAdj: form.TZAdj ? Number(form.TZAdj) : null,
      ErrorDelay: Number(form.ErrorDelay),
      Delay: Number(form.Delay),
      TransInterval: Number(form.TransInterval),
    };
    try {
      if (mode === "create") {
        await request("/iclock/active-device/", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await request(`/iclock/active-device/${device!.SN}/`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[]> | null;
        setError(body ? Object.values(body).flat().join(" ") : "Gagal menyimpan device.");
      } else {
        setError("Gagal menyimpan device.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Tambah Device
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Active Device" : `Edit Device — ${device?.SN}`}</DialogTitle>
          <DialogDescription>
            Konfigurasi device fingerprint, termasuk parameter PUSH SDK yang dikirim ke device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sn">Serial Number</Label>
              <Input id="sn" value={form.SN} disabled={mode === "edit"} required
                onChange={(e) => setForm((f) => ({ ...f, SN: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" value={form.Alias} required
                onChange={(e) => setForm((f) => ({ ...f, Alias: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pool</Label>
              <Select value={form.DeptID} onValueChange={(v) => setForm((f) => ({ ...f, DeptID: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.DeptID} value={String(d.DeptID)}>{d.DeptName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="function">Function Code</Label>
              <Select value={form.Function} onValueChange={(v) => setForm((f) => ({ ...f, Function: v }))}>
                <SelectTrigger id="function"><SelectValue placeholder="Pilih function" /></SelectTrigger>
                <SelectContent>
                  {functionChoices.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ip">IP Address</Label>
              <Input id="ip" value={form.IPAddress} placeholder="192.168.1.100" className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, IPAddress: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mac">MAC Address</Label>
              <Input id="mac" value={form.MAC} placeholder="00:11:22:33:44:55" className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, MAC: e.target.value }))} />
            </div>
          </div>

          <Separator />
          <p className="text-xs font-medium text-muted-foreground">Konfigurasi PUSH SDK</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="errordelay">Error Delay</Label>
              <Input id="errordelay" type="number" value={form.ErrorDelay}
                onChange={(e) => setForm((f) => ({ ...f, ErrorDelay: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delay">Delay</Label>
              <Input id="delay" type="number" value={form.Delay}
                onChange={(e) => setForm((f) => ({ ...f, Delay: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transinterval">Trans Interval</Label>
              <Input id="transinterval" type="number" value={form.TransInterval}
                onChange={(e) => setForm((f) => ({ ...f, TransInterval: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transtimes">Trans Times</Label>
            <Input id="transtimes" value={form.TransTimes}
              onChange={(e) => setForm((f) => ({ ...f, TransTimes: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="updatedb">Trans Flag (UpdateDB)</Label>
            <Input id="updatedb" value={form.UpdateDB} className="font-mono"
              onChange={(e) => setForm((f) => ({ ...f, UpdateDB: e.target.value }))} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.Realtime} onCheckedChange={(v) => setForm((f) => ({ ...f, Realtime: v }))} />
              Realtime
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.Encrypt} onCheckedChange={(v) => setForm((f) => ({ ...f, Encrypt: v }))} />
              Encrypt
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
