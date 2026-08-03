"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import type { IDCardHolder } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

export function HolderFormDialog({
  mode, holder, open, onOpenChange,
}: {
  mode: "add" | "edit";
  holder?: IDCardHolder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cardType, setCardType] = useState<"visitor" | "bhl">("visitor");
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && holder) {
      setCardType(holder.card_type);
      setFullName(holder.full_name);
      setIdNumber(holder.id_number);
      setCompany(holder.company);
      setPurpose(holder.purpose);
      setValidUntil(holder.valid_until ?? "");
    } else {
      setCardType("visitor"); setFullName(""); setIdNumber(""); setCompany(""); setPurpose(""); setValidUntil("");
    }
    setPhotoFile(null);
    setError(null);
  }, [open, mode, holder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("card_type", cardType);
      formData.append("full_name", fullName);
      formData.append("id_number", idNumber);
      formData.append("company", company);
      formData.append("purpose", purpose);
      if (validUntil) formData.append("valid_until", validUntil);
      if (photoFile) formData.append("photo", photoFile);

      const url = mode === "add" ? `${API_BASE_URL}/idcard/holders/` : `${API_BASE_URL}/idcard/holders/${holder!.id}/`;
      const res = await fetch(url, {
        method: mode === "add" ? "POST" : "PATCH",
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw { status: res.status, body };
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan data."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Data Visitor/BHL" : `Edit — ${holder?.full_name}`}</DialogTitle>
          <DialogDescription>Data ini dipakai saat generate ID Card jenis Visitor/BHL.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          <div className="space-y-1.5">
            <Label>Jenis</Label>
            <Select value={cardType} onValueChange={(v) => setCardType(v as "visitor" | "bhl")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="bhl">BHL (Buruh Harian Lepas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-name">Nama Lengkap</Label>
            <Input id="h-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-idnum">No. KTP/Identitas</Label>
            <Input id="h-idnum" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          </div>

          {cardType === "visitor" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="h-company">Perusahaan Asal</Label>
                <Input id="h-company" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-purpose">Keperluan/Sponsor</Label>
                <Input id="h-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Tujuan kunjungan / nama yang dituju" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="h-valid">Berlaku Sampai (opsional)</Label>
            <Input id="h-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-photo">Foto {mode === "edit" && "(kosongkan kalau tidak ganti)"}</Label>
            <Input id="h-photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
