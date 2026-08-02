"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { ITInfraCategory, ITInfraEntryDetail } from "@/types/api";
import { KeyValueEditor, type KeyValueRow } from "./key-value-editor";

export function ItInfraFormDialog({
  mode, entryId, categories, open, onOpenChange,
}: {
  mode: "add" | "edit";
  /** Wajib diisi kalau mode="edit". */
  entryId?: number;
  categories: ITInfraCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isStaffOnly, setIsStaffOnly] = useState(false);
  const [rows, setRows] = useState<KeyValueRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (mode === "edit" && entryId) {
      setFetchingDetail(true);
      request<ITInfraEntryDetail>(`/netmgmt/itinfra/entries/${entryId}/`)
        .then((detail) => {
          setCategoryId(String(detail.category_id));
          setName(detail.name);
          setNotes(detail.notes);
          setIsStaffOnly(detail.is_staff_only);
          setRows(Object.entries(detail.data).map(([key, value]) => ({ key, value: String(value) })));
        })
        .catch((err) => setError(extractErrorMessage(err, "Gagal mengambil detail data.")))
        .finally(() => setFetchingDetail(false));
    } else {
      setCategoryId(categories[0] ? String(categories[0].id) : "");
      setName("");
      setNotes("");
      setIsStaffOnly(false);
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, entryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dataObj: Record<string, string> = {};
      for (const row of rows) {
        if (row.key.trim()) dataObj[row.key.trim()] = row.value;
      }

      const body: Record<string, unknown> = { category_id: Number(categoryId), name, data: dataObj, notes, is_staff_only: isStaffOnly };
      if (mode === "add") {
        await request("/netmgmt/itinfra/entries/action/", { method: "POST", body: JSON.stringify({ ...body, action: "add" }) });
      } else {
        await request("/netmgmt/itinfra/entries/action/", { method: "POST", body: JSON.stringify({ ...body, action: "edit", entry_id: entryId }) });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, `Gagal ${mode === "add" ? "menambah" : "memperbarui"} data.`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Data IT-Infra" : "Edit Data IT-Infra"}</DialogTitle>
          <DialogDescription>Field &quot;Data&quot; bebas -- isi apa pun sesuai kebutuhan (mis. username, password, IP, dll).</DialogDescription>
        </DialogHeader>

        {fetchingDetail ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="itinfra-name">Nama</Label>
              <Input id="itinfra-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Internet Kantor Pusat - Biznet" />
            </div>

            <KeyValueEditor rows={rows} onChange={setRows} />

            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm">
              <Checkbox checked={isStaffOnly} onCheckedChange={(v) => setIsStaffOnly(v === true)} className="mt-0.5" />
              <span>
                <span className="font-medium">Staff Only</span>
                <span className="block text-xs text-muted-foreground">Kalau dicentang, entry ini HANYA bisa dilihat staff/admin -- tersembunyi dari user portal non-staff meski mereka punya izin akses fitur ini.</span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="itinfra-notes">Catatan (opsional)</Label>
              <Textarea id="itinfra-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={loading || !categoryId}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {mode === "add" ? "Tambah" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
