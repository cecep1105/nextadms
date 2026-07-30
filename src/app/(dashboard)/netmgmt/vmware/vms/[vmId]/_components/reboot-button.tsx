"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

/**
 * Reboot VM -- panggil endpoint proxy GENERIK yang sudah ada
 * (/api/vsphere/[...path], BUKAN endpoint baru) krn ini cuma
 * "teruskan apa adanya" ke vCenter, tidak butuh transformasi respons
 * spt tiket VMRC.
 *
 * PENTING: `/power/reset` adalah HARD RESET (spt tekan tombol reset
 * fisik) -- BUKAN restart OS yang rapi (soft reboot via VMware Tools).
 * Kalau butuh soft reboot nanti, endpoint-nya beda
 * (/rest/vcenter/vm/{vm}/guest/power -- perlu VMware Tools jalan di
 * guest), di luar scope saat ini.
 */
export function RebootButton({ vmId }: { vmId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReboot() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vsphere/vm/${encodeURIComponent(vmId)}/power/reset`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Gagal reboot VM.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reboot VM.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw className="h-3.5 w-3.5" /> Reboot
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reboot VM?</DialogTitle>
            <DialogDescription>
              Ini adalah <span className="font-medium text-foreground">hard reset</span> (setara menekan tombol reset fisik) --
              BUKAN restart OS yang rapi. Data yang belum tersimpan di guest OS bisa hilang.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReboot} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Reboot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
