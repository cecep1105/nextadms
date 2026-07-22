"use client";
import { useState } from "react";
import { Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { Department, ActiveDevice, Employee } from "@/types/api";

export function TransferFingerDialog({
  employee, departments, devices,
}: {
  employee: Employee;
  departments: Department[];
  devices: ActiveDevice[];
}) {
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[] | null>(null);
  const [toPool, setToPool] = useState("");
  const [targetDevice, setTargetDevice] = useState("");

  const devicesInPool = devices.filter((d) => String(d.DeptID) === toPool);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setLog(null);
      setToPool("");
      setTargetDevice("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLog(null);
    try {
      const result = await request<{ log: string[]; db_template_count: number }>(
        `/iclock/device-user/${employee.id}/transfer-finger/`,
        { method: "POST", body: JSON.stringify({ to_pool: toPool, target_device: targetDevice || undefined }) }
      );
      setLog(result.log);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal transfer fingerprint."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Transfer Finger">
        <Fingerprint className="h-3.5 w-3.5" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Fingerprint — {employee.PIN}</DialogTitle>
          <DialogDescription>
            Kirim template fingerprint employee ini (dari database, sudah pernah di-backup dari device
            manapun) ke device tujuan. Device SUMBER tidak perlu online.
          </DialogDescription>
        </DialogHeader>

        {log ? (
          <div className="space-y-3">
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
              {log.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label>Pool Tujuan</Label>
              <Select value={toPool} onValueChange={(v) => { setToPool(v); setTargetDevice(""); }}>
                <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.DeptID} value={String(d.DeptID)}>{d.DeptName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Device Spesifik (opsional)</Label>
              <Select value={targetDevice} onValueChange={setTargetDevice} disabled={!toPool}>
                <SelectTrigger><SelectValue placeholder="Semua device di pool ini" /></SelectTrigger>
                <SelectContent>
                  {devicesInPool.map((d) => (
                    <SelectItem key={d.SN} value={d.SN}>{d.Alias}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Kosongkan untuk kirim ke SEMUA device di pool tujuan.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={loading || !toPool}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Transfer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
