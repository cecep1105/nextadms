"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export function AddCategoryDialog() {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/netmgmt/itinfra/categories/", { method: "POST", body: JSON.stringify({ name }) });
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menambah kategori."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FolderPlus className="h-3.5 w-3.5" /> Kategori Baru
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>Mis. Internet, VPS, Domain, Lisensi Software, dll.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="VPS" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Tambah
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
