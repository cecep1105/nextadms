"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { MikrotikNetwatchItem } from "@/types/api";

/**
 * Versi PORTAL dari NetwatchFormDialog (staff) -- UI SAMA PERSIS, BEDA
 * cuma endpoint yang dipanggil: staff pakai proxy generik
 * (?postcmd=add/set, staff-only), portal pakai
 * /netmgmt/portal/netwatch/action/ (endpoint TERBATAS -- action CUMA
 * add/edit, TIDAK ada delete/command bebas, lihat netmgmt/portal_views.py).
 */
export function PortalNetwatchFormDialog({
  mode, item, open, onOpenChange,
}: {
  mode: "add" | "edit";
  /** Wajib diisi kalau mode="edit". */
  item?: MikrotikNetwatchItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [host, setHost] = useState("");
  const [upScript, setUpScript] = useState("");
  const [downScript, setDownScript] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && item) {
      setHost(item.host);
      setUpScript(item["up-script"] ?? "");
      setDownScript(item["down-script"] ?? "");
      setComment(item.comment ?? "");
    } else {
      setHost(""); setUpScript(""); setDownScript(""); setComment("");
    }
    setError(null);
  }, [open, mode, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        action: mode,
        host,
        "up-script": upScript,
        "down-script": downScript,
        comment,
      };
      if (mode === "edit" && item) body.id = item.id;

      await request("/netmgmt/portal/netwatch/action/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, `Gagal ${mode === "add" ? "menambah" : "memperbarui"} host netwatch.`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Host Netwatch" : "Edit Host Netwatch"}</DialogTitle>
          <DialogDescription>
            Up-script/down-script dijalankan RouterOS sendiri saat status host berubah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label htmlFor="host">Host (IP Address)</Label>
            <Input id="host" required value={host} onChange={(e) => setHost(e.target.value)} className="font-mono" placeholder="192.168.1.1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment">Comment</Label>
            <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Server ABC" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="up-script">Up Script</Label>
            <Textarea id="up-script" value={upScript} onChange={(e) => setUpScript(e.target.value)} className="font-mono text-xs" rows={4} placeholder=':log info "host up"' />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="down-script">Down Script</Label>
            <Textarea id="down-script" value={downScript} onChange={(e) => setDownScript(e.target.value)} className="font-mono text-xs" rows={4} placeholder=':log info "host down"' />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {mode === "add" ? "Tambah" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
