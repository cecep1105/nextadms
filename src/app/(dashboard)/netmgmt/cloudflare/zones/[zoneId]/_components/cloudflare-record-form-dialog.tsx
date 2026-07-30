"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { CloudflareDnsRecord, CloudflareRecordType } from "@/types/api";

const RECORD_TYPES: CloudflareRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];
const PROXIABLE_TYPES: CloudflareRecordType[] = ["A", "AAAA", "CNAME"];

const CONTENT_LABEL: Record<CloudflareRecordType, string> = {
  A: "Alamat IPv4",
  AAAA: "Alamat IPv6",
  CNAME: "Target (FQDN)",
  MX: "Mail Server (FQDN)",
  TXT: "Text",
  NS: "Nameserver",
};

export function CloudflareRecordFormDialog({
  mode, zoneId, record, open, onOpenChange,
}: {
  mode: "add" | "edit";
  zoneId: string;
  /** Wajib diisi kalau mode="edit". */
  record?: CloudflareDnsRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<CloudflareRecordType>("A");
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("1"); // 1 = "Auto" di Cloudflare
  const [proxied, setProxied] = useState(false);
  const [priority, setPriority] = useState("10");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && record) {
      setName(record.name);
      setType(record.type as CloudflareRecordType);
      setContent(record.content);
      setTtl(String(record.ttl));
      setProxied(record.proxied);
      setPriority(record.priority != null ? String(record.priority) : "10");
    } else {
      setName(""); setType("A"); setContent(""); setTtl("1"); setProxied(false); setPriority("10");
    }
    setError(null);
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { type, name, content, ttl: Number(ttl) };
      if (PROXIABLE_TYPES.includes(type)) body.proxied = proxied;
      if (type === "MX") body.priority = Number(priority);

      if (mode === "add") {
        await request(`/netmgmt/cloudflare/zones/${zoneId}/records/action/`, {
          method: "POST",
          body: JSON.stringify({ ...body, action: "add" }),
        });
      } else if (record) {
        await request(`/netmgmt/cloudflare/zones/${zoneId}/records/action/`, {
          method: "POST",
          body: JSON.stringify({ ...body, action: "edit", record_id: record.id }),
        });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, `Gagal ${mode === "add" ? "menambah" : "memperbarui"} record.`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Record DNS" : "Edit Record DNS"}</DialogTitle>
          <DialogDescription>Domain: <span className="font-mono">{name || "..."}</span></DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label htmlFor="cf-name">Nama Host</Label>
            <Input id="cf-name" required value={name} onChange={(e) => setName(e.target.value)} className="font-mono" placeholder="www (atau @ utk root domain)" />
          </div>

          <div className="space-y-1.5">
            <Label>Tipe Record</Label>
            <Select value={type} onValueChange={(v) => setType(v as CloudflareRecordType)} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {mode === "edit" && <p className="text-[11px] text-muted-foreground">Tipe tidak bisa diubah saat edit -- hapus &amp; buat record baru kalau perlu ganti tipe.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-content">{CONTENT_LABEL[type]}</Label>
            <Input id="cf-content" required value={content} onChange={(e) => setContent(e.target.value)} className="font-mono" />
          </div>

          {type === "MX" && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-priority">Priority</Label>
              <Input id="cf-priority" type="number" min="0" required value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cf-ttl">TTL (detik, 1 = Auto)</Label>
            <Input id="cf-ttl" type="number" min="1" value={ttl} onChange={(e) => setTtl(e.target.value)} />
          </div>

          {PROXIABLE_TYPES.includes(type) && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <Label htmlFor="cf-proxied" className="cursor-pointer">Proxy lewat Cloudflare</Label>
                <p className="text-[11px] text-muted-foreground">Ikon awan oranye -- lalu lintas dirutekan lewat CDN/proteksi Cloudflare.</p>
              </div>
              <Switch id="cf-proxied" checked={proxied} onCheckedChange={setProxied} />
            </div>
          )}

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
