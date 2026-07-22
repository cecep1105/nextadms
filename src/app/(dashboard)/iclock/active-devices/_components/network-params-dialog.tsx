"use client";
import { useEffect, useState } from "react";
import { Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

interface NetworkParams {
  ip: string;
  mask: string;
  gateway: string;
}

export function NetworkParamsDialog({
  sn, alias, open, onOpenChange,
}: {
  sn: string;
  alias: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { request } = useApiClient();
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [current, setCurrent] = useState<NetworkParams | null>(null);
  const [form, setForm] = useState({ new_ip: "", new_netmask: "", new_gateway: "" });

  async function loadCurrent() {
    setLoadingCurrent(true);
    setError(null);
    try {
      const data = await request<NetworkParams>(`/iclock/active-device/${sn}/network-params/`);
      setCurrent(data);
      setForm({ new_ip: data.ip, new_netmask: data.mask, new_gateway: data.gateway });
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal membaca parameter jaringan device."));
    } finally {
      setLoadingCurrent(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadCurrent();
      setSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await request<{ success: boolean; message: string }>(
        `/iclock/active-device/${sn}/network-params/`,
        { method: "POST", body: JSON.stringify(form) }
      );
      if (result.success) {
        setSuccess(result.message);
        loadCurrent();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah parameter jaringan."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Network Params — {alias}</DialogTitle>
          <DialogDescription>
            ⚠️ Mengubah IP/Netmask/Gateway bisa membuat device TIDAK TERJANGKAU lagi kalau salah
            input — pastikan IP baru masih dalam jaringan yang sama & bisa diakses server ini.
          </DialogDescription>
        </DialogHeader>

        {loadingCurrent ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {success && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{success}</div>}

            {current && (
              <div className="rounded-md border border-border bg-muted p-3 font-mono text-[11px] text-muted-foreground">
                Saat ini: {current.ip} / {current.mask} / gw {current.gateway}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new_ip">IP Address Baru</Label>
              <Input id="new_ip" value={form.new_ip} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, new_ip: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_netmask">Netmask Baru</Label>
              <Input id="new_netmask" value={form.new_netmask} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, new_netmask: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_gateway">Gateway Baru</Label>
              <Input id="new_gateway" value={form.new_gateway} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, new_gateway: e.target.value }))} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />} Terapkan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
