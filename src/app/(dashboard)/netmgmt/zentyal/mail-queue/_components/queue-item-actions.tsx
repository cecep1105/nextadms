"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/** Aksi per-baris mail queue -- Requeue (coba kirim ulang) & Delete (hapus permanen dari queue Postfix). */
export function QueueItemActions({ qid }: { qid: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [busy, setBusy] = useState<"requeue" | "delete" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequeue() {
    setBusy("requeue");
    setError(null);
    try {
      await request("/netmgmt/zentyal-mail/queue/", {
        method: "POST",
        body: JSON.stringify({ command: "REQUEUE", qids: [qid] }),
      });
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal requeue pesan."));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    setError(null);
    try {
      await request("/netmgmt/zentyal-mail/queue/", {
        method: "POST",
        body: JSON.stringify({ command: "DELETE", qids: [qid] }),
      });
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus pesan."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex justify-end gap-0.5">
      <Button variant="ghost" size="icon" onClick={handleRequeue} disabled={busy !== null} aria-label="Requeue">
        {busy === "requeue" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} disabled={busy !== null} aria-label="Hapus">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus dari Queue?</DialogTitle>
            <DialogDescription>Pesan dgn Queue ID <span className="font-mono font-medium text-foreground">{qid}</span> akan dihapus PERMANEN dari mail queue.</DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy !== null}>
              {busy === "delete" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
