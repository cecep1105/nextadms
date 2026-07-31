"use client";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface KeyValueRow {
  key: string;
  value: string;
}

/**
 * Editor field BEBAS (tambah/hapus baris key-value sendiri) -- dipakai
 * utk `data` di Data IT-Infra (netmgmt/models.py::ITInfraEntry), krn
 * field-nya TIDAK PUNYA skema tetap per kategori (internet/VPS/domain/
 * dll semua BISA beda field) -- ini pendekatan PALING FLEKSIBEL, admin
 * bebas isi field APA PUN sesuai kebutuhan tiap entry.
 */
export function KeyValueEditor({ rows, onChange }: { rows: KeyValueRow[]; onChange: (rows: KeyValueRow[]) => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  function updateRow(index: number, patch: Partial<KeyValueRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { key: "", value: "" }]);
  }

  function toggleReveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  // Field yg NAMANYA mengandung "password"/"secret" DIANGGAP sensitif --
  // disamarkan (type="password") sampai tombol mata diklik, MURNI supaya
  // tidak nampang di layar (mis. saat screen-share) -- BUKAN keamanan
  // tambahan (data toh SUDAH dikirim ke browser di titik ini).
  function isSensitive(key: string): boolean {
    const lower = key.toLowerCase();
    return lower.includes("password") || lower.includes("secret") || lower.includes("pass");
  }

  return (
    <div className="space-y-2">
      <Label>Data (field bebas)</Label>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">Belum ada field -- klik &quot;Tambah Field&quot; di bawah.</p>}
      {rows.map((row, i) => {
        const sensitive = isSensitive(row.key);
        const isRevealed = revealed.has(i);
        return (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={row.key}
              onChange={(e) => updateRow(i, { key: e.target.value })}
              placeholder="nama field, mis. username"
              className="w-40 font-mono text-xs"
            />
            <Input
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="isi"
              type={sensitive && !isRevealed ? "password" : "text"}
              className="flex-1 font-mono text-xs"
            />
            {sensitive && (
              <Button type="button" variant="ghost" size="icon" onClick={() => toggleReveal(i)} aria-label="Tampilkan/sembunyikan">
                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeRow(i)} aria-label="Hapus field">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" /> Tambah Field
      </Button>
    </div>
  );
}
