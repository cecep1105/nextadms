"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardType } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

const CARD_TYPES: { value: IDCardType; label: string }[] = [
  { value: "karyawan", label: "Karyawan" },
  { value: "driver", label: "Driver" },
  { value: "visitor", label: "Visitor" },
  { value: "bhl", label: "BHL (Buruh Harian Lepas)" },
];

/**
 * Upload template PAKAI fetch() MANUAL (BUKAN useApiClient().request(),
 * yang set Content-Type: application/json secara default) -- body FormData
 * (berisi file gambar) BUTUH Content-Type multipart/form-data DENGAN
 * boundary yang di-generate browser OTOMATIS, TIDAK BOLEH di-set manual.
 */
export function AddTemplateButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cardType, setCardType] = useState<IDCardType>("karyawan");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function resetForm() {
    setCardType("karyawan");
    setName("");
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Gambar background wajib dipilih.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("card_type", cardType);
      formData.append("name", name);
      formData.append("background_image", file);

      const res = await fetch(`${API_BASE_URL}/idcard/templates/`, {
        method: "POST",
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw { status: res.status, body };
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menambahkan template."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah Template</Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Template ID Card</DialogTitle>
          <DialogDescription>Upload gambar background -- posisi foto & teks di atasnya sudah ditentukan otomatis.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label>Jenis Kartu</Label>
            <Select value={cardType} onValueChange={(v) => setCardType(v as IDCardType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CARD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmpl-name">Nama Template</Label>
            <Input id="tmpl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder='mis. "Karyawan - Biru 2026"' />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmpl-file">Gambar Background</Label>
            <Input id="tmpl-file" type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-[11px] text-muted-foreground">Resolusi apa pun diterima -- otomatis diskalakan mengisi penuh ukuran kartu.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
