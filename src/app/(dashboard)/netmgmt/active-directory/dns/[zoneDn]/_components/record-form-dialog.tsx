"use client";
import { useEffect, useState } from "react";
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
import type { DnsRecordRow } from "@/types/api";

// Sesuai permintaan -- CUMA A & CNAME yang ditawarkan (backend JUGA
// menolak tipe lain di endpoint ini, lihat netmgmt/active_directory_dns_view.py
// ::_VISIBLE_RECORD_TYPES).
type SimpleRecordType = "A" | "CNAME";
const RECORD_TYPES: SimpleRecordType[] = ["A", "CNAME"];

export function RecordFormDialog({
  mode, zoneDn, record, open, onOpenChange,
}: {
  mode: "add" | "edit";
  zoneDn: string;
  record?: DnsRecordRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<SimpleRecordType>("A");
  const [ttl, setTtl] = useState("3600");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && record) {
      setName(record.name);
      setType(record.type as SimpleRecordType);
      setTtl(String(record.ttl_seconds));
      setValue(record.type === "A" ? (record.data.address ?? "") : (record.data.target ?? ""));
    } else {
      setName("");
      setType("A");
      setTtl("3600");
      setValue("");
    }
    setError(null);
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = type === "A" ? { address: value } : { target: value };

      if (mode === "add") {
        await request("/netmgmt/ad/dns/records/", {
          method: "POST",
          body: JSON.stringify({ action: "add", zone_dn: zoneDn, name, type, data, ttl_seconds: Number(ttl) }),
        });
      } else if (record) {
        await request("/netmgmt/ad/dns/records/", {
          method: "POST",
          body: JSON.stringify({ action: "edit", node_dn: record.node_dn, old_raw_b64: record.raw_b64, type, data, ttl_seconds: Number(ttl) }),
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Record DNS" : "Edit Record DNS"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Kalau nama sudah ada (mis. tambah A record ke-2 utk round-robin), record baru ditambahkan ke node yang sama."
              : "Mengubah record ini TIDAK mempengaruhi record lain di node yang sama (kalau ada, mis. round-robin)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          {mode === "add" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Host</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="font-mono" placeholder="www (atau @ utk root zone)" required />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipe Record</Label>
            <Select value={type} onValueChange={(v) => { setType(v as SimpleRecordType); setValue(""); }} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {mode === "edit" && <p className="text-[11px] text-muted-foreground">Tipe tidak bisa diubah saat edit -- hapus &amp; buat record baru kalau perlu ganti tipe.</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{type === "A" ? "Alamat IPv4" : "Target (FQDN)"}</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono"
              placeholder={type === "A" ? "192.168.1.100" : "server1.contoso.com"}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ttl">TTL (detik)</Label>
            <Input id="ttl" type="number" min="1" value={ttl} onChange={(e) => setTtl(e.target.value)} required />
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
