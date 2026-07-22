"use client";
import { useState } from "react";
import { Loader2, HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export function BackupFingerprintsDialog({
  sn, alias, open, onOpenChange,
}: {
  sn: string;
  alias: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[] | null>(null);
  const [pinPattern, setPinPattern] = useState("");

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setError(null);
      setLog(null);
      setPinPattern("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await request<{ log: string[] }>(
        `/iclock/active-device/${sn}/backup-fingerprints/`,
        { method: "POST", body: JSON.stringify({ pin_pattern: pinPattern }) }
      );
      setLog(result.log);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal backup fingerprint."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Backup Fingerprint — {alias}</DialogTitle>
          <DialogDescription>
            Ambil semua user + template fingerprint dari device fisik, simpan/perbarui ke database
            (dipakai sbg sumber utk fitur Transfer Finger di halaman Employee).
          </DialogDescription>
        </DialogHeader>

        {log ? (
          <div className="space-y-3">
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
              {log.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="pinpattern">Filter PIN (opsional)</Label>
              <Input id="pinpattern" value={pinPattern} onChange={(e) => setPinPattern(e.target.value)} placeholder="Kosongkan utk backup SEMUA user" className="font-mono" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HardDriveDownload className="h-3.5 w-3.5" />} Mulai Backup
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
