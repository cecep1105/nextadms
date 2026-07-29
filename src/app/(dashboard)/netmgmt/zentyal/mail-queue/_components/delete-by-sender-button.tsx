"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/** Hapus SEMUA pesan di queue dari 1 sender sekaligus -- berguna kalau ada spam/backscatter dari 1 alamat, drpd hapus satu-satu. */
export function DeleteBySenderButton() {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [sender, setSender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/netmgmt/zentyal-mail/queue/", {
        method: "POST",
        body: JSON.stringify({ command: "DELQFROMSENDER", sender }),
      });
      setOpen(false);
      setSender("");
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus pesan dari sender ini."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" /> Hapus per Sender
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Semua Pesan dari Sender</DialogTitle>
            <DialogDescription>Semua pesan di queue dari alamat ini akan dihapus PERMANEN sekaligus.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="sender">Alamat Sender</Label>
              <Input id="sender" type="email" required value={sender} onChange={(e) => setSender(e.target.value)} placeholder="spammer@contoh.com" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
