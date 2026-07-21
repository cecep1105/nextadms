"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
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
import type { ActiveDevice } from "@/types/api";

const COMMON_COMMANDS = [
  { value: "CHECK", label: "CHECK -- cek data baru & upload instan" },
  { value: "REBOOT", label: "REBOOT -- restart device" },
  { value: "LOG", label: "LOG -- cek & upload data baru" },
  { value: "RELOAD OPTIONS", label: "RELOAD OPTIONS -- muat ulang konfigurasi" },
  { value: "custom", label: "Custom..." },
];

export function SendCommandDialog({ devices }: { devices: ActiveDevice[] }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sn, setSn] = useState("");
  const [preset, setPreset] = useState("CHECK");
  const [customContent, setCustomContent] = useState("");

  const cmdContent = preset === "custom" ? customContent : preset;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/iclock/device-command/", {
        method: "POST",
        body: JSON.stringify({ SN: sn, CmdContent: cmdContent }),
      });
      setOpen(false);
      setSn("");
      setPreset("CHECK");
      setCustomContent("");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[]> | null;
        setError(body ? Object.values(body).flat().join(" ") : "Gagal mengirim command.");
      } else {
        setError("Gagal mengirim command.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}><Send className="h-3.5 w-3.5" /> Kirim Command</Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim Command ke Device</DialogTitle>
          <DialogDescription>
            Command masuk antrean, device akan mengambilnya di polling <code>getrequest</code> berikutnya
            (tidak instan -- lihat resume protokol §5.1).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <div className="space-y-1.5">
            <Label>Device</Label>
            <Select value={sn} onValueChange={setSn}>
              <SelectTrigger><SelectValue placeholder="Pilih device" /></SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.SN} value={d.SN}>{d.Alias} ({d.SN})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Command</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_COMMANDS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {preset === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="custom">Isi Command</Label>
              <Input id="custom" value={customContent} onChange={(e) => setCustomContent(e.target.value)} className="font-mono" required />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading || !sn || !cmdContent}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Kirim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
