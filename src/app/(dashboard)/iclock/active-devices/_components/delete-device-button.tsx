"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";

export function DeleteDeviceButton({ sn, alias }: { sn: string; alias: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await request(`/iclock/active-device/${sn}/`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Hapus" className="text-destructive hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Device?</DialogTitle>
          <DialogDescription>
            Device <span className="font-mono font-medium text-foreground">{sn}</span> ({alias}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
