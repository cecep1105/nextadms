"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { MailTransportRow } from "@/types/api";

/**
 * Transport map Postfix (domain -> target relay) -- diedit sbg SATU
 * TABEL UTUH (tambah/hapus/ubah baris lokal dulu, baru "Simpan Semua"
 * kirim SELURUH isi tabel ke backend) -- BEDA dari pola CRUD per-baris
 * di tabel lain, krn Flask API-nya (`set_transport`) memang menulis
 * ULANG SELURUH file transport tiap kali dipanggil (bukan modify 1 baris).
 */
export function TransportMapEditor({ initialRows }: { initialRows: MailTransportRow[] }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [rows, setRows] = useState<MailTransportRow[]>(initialRows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(index: number, patch: Partial<MailTransportRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setSuccess(false);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setSuccess(false);
  }

  function addRow() {
    setRows((prev) => [...prev, { domain: "", target: "", status: "1" }]);
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await request("/netmgmt/zentyal-mail/transport/", {
        method: "POST",
        body: JSON.stringify({
          transport_data: rows.map((r) => ({ domain: r.domain, target: r.target, status: r.status === "1" })),
        }),
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan transport map."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3.5 w-3.5" /> Tambah Baris</Button>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan Semua
        </Button>
      </div>

      {error && <div className="m-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
      {success && <div className="m-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Transport map berhasil disimpan &amp; Postfix di-reload.</div>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Aktif?</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada baris transport map.</TableCell></TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell><Input value={row.domain} onChange={(e) => updateRow(i, { domain: e.target.value })} className="font-mono" placeholder="contoso.com" /></TableCell>
                <TableCell><Input value={row.target} onChange={(e) => updateRow(i, { target: e.target.value })} className="font-mono" placeholder="smtp:[mail.contoso.com]" /></TableCell>
                <TableCell><Switch checked={row.status === "1"} onCheckedChange={(checked) => updateRow(i, { status: checked ? "1" : "0" })} /></TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
