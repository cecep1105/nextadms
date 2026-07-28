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
import type { DnsRecordRow, DnsRecordType } from "@/types/api";

const RECORD_TYPES: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "SRV", "TXT", "NS", "PTR"];

/**
 * Field FORM beda per tipe record -- lihat netmgmt/dns_codec.py utk field
 * PERSIS yang dibutuhkan tiap tipe (data dikirim APA ADANYA sbg objek
 * `data`, backend yg validasi/encode ke format binary AD).
 */
function RecordDataFields({
  type, data, onChange,
}: {
  type: DnsRecordType;
  data: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}) {
  function set(key: string, value: string) {
    onChange({ ...data, [key]: value });
  }

  if (type === "A" || type === "AAAA") {
    return (
      <div className="space-y-1.5">
        <Label>{type === "A" ? "Alamat IPv4" : "Alamat IPv6"}</Label>
        <Input value={data.address ?? ""} onChange={(e) => set("address", e.target.value)} className="font-mono" placeholder={type === "A" ? "192.168.1.100" : "2001:db8::1"} required />
      </div>
    );
  }

  if (type === "CNAME" || type === "NS" || type === "PTR") {
    return (
      <div className="space-y-1.5">
        <Label>Target (FQDN)</Label>
        <Input value={data.target ?? ""} onChange={(e) => set("target", e.target.value)} className="font-mono" placeholder="server1.contoso.com" required />
      </div>
    );
  }

  if (type === "MX") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Preference</Label>
          <Input type="number" min="0" value={data.preference ?? ""} onChange={(e) => set("preference", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Mail Exchange (FQDN)</Label>
          <Input value={data.exchange ?? ""} onChange={(e) => set("exchange", e.target.value)} className="font-mono" placeholder="mail.contoso.com" required />
        </div>
      </div>
    );
  }

  if (type === "SRV") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Input type="number" min="0" value={data.priority ?? ""} onChange={(e) => set("priority", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Weight</Label>
            <Input type="number" min="0" value={data.weight ?? ""} onChange={(e) => set("weight", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input type="number" min="0" value={data.port ?? ""} onChange={(e) => set("port", e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Target (FQDN)</Label>
          <Input value={data.target ?? ""} onChange={(e) => set("target", e.target.value)} className="font-mono" placeholder="dc01.contoso.com" required />
        </div>
      </div>
    );
  }

  // TXT
  return (
    <div className="space-y-1.5">
      <Label>Text</Label>
      <Input value={data.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="v=spf1 include:_spf.google.com ~all" required />
    </div>
  );
}

export function RecordFormDialog({
  mode, zoneDn, record, open, onOpenChange,
}: {
  mode: "add" | "edit";
  zoneDn: string;
  /** Wajib diisi kalau mode="edit" (record yg sedang diedit). */
  record?: DnsRecordRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<DnsRecordType>("A");
  const [ttl, setTtl] = useState("3600");
  const [data, setData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && record) {
      setName(record.name);
      setType(record.type as DnsRecordType);
      setTtl(String(record.ttl_seconds));
      setData(Object.fromEntries(Object.entries(record.data).map(([k, v]) => [k, String(v ?? "")])));
    } else {
      setName("");
      setType("A");
      setTtl("3600");
      setData({});
    }
    setError(null);
  }, [open, mode, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Konversi field angka (preference/priority/weight/port) dari string -> number sebelum dikirim.
      const numericFields = ["preference", "priority", "weight", "port"];
      const preparedData: Record<string, string | number> = { ...data };
      for (const field of numericFields) {
        if (field in preparedData) preparedData[field] = Number(preparedData[field]);
      }

      if (mode === "add") {
        await request("/netmgmt/ad/dns/records/", {
          method: "POST",
          body: JSON.stringify({ action: "add", zone_dn: zoneDn, name, type, data: preparedData, ttl_seconds: Number(ttl) }),
        });
      } else if (record) {
        await request("/netmgmt/ad/dns/records/", {
          method: "POST",
          body: JSON.stringify({ action: "edit", node_dn: record.node_dn, old_raw_b64: record.raw_b64, type, data: preparedData, ttl_seconds: Number(ttl) }),
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
            <Select value={type} onValueChange={(v) => { setType(v as DnsRecordType); setData({}); }} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {mode === "edit" && <p className="text-[11px] text-muted-foreground">Tipe tidak bisa diubah saat edit -- hapus &amp; buat record baru kalau perlu ganti tipe.</p>}
          </div>

          <RecordDataFields type={type} data={data} onChange={setData} />

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
