"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { ITInfraEntryDetail } from "@/types/api";

const SENSITIVE_KEY_PATTERN = /password|secret|token|key|credential/i;

function ValueRow({ label, value }: { label: string; value: string }) {
  const isSensitive = SENSITIVE_KEY_PATTERN.test(label);
  const [revealed, setRevealed] = useState(!isSensitive);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-sm">{revealed ? value : "••••••••"}</span>
        {isSensitive && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRevealed((r) => !r)} aria-label={revealed ? "Sembunyikan" : "Tampilkan"}>
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} aria-label="Salin">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * View-only detail Data IT-Infra utk portal -- SENGAJA TIDAK ADA form
 * edit (cakupan portal cuma lihat, lihat netmgmt/itinfra_view.py::
 * ITInfraEntryDetailView). Field yg nama key-nya mengandung
 * password/secret/token/key/credential DISAMARKAN default (titik-titik),
 * ada tombol mata utk tampilkan sementara.
 */
export function ItInfraViewDetailDialog({
  entryId, entryName, open, onOpenChange,
}: {
  entryId: number;
  entryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ITInfraEntryDetail | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    request<ITInfraEntryDetail>(`/netmgmt/itinfra/entries/${entryId}/`)
      .then(setDetail)
      .catch((err) => setError(extractErrorMessage(err, "Gagal mengambil detail data.")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entryId]);

  const entries = detail ? Object.entries(detail.data) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> {entryName}</DialogTitle>
          <DialogDescription>
            {detail?.category_name && <>Kategori: <span className="font-medium text-foreground">{detail.category_name}</span></>}
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : detail ? (
          <div>
            {entries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada data tersimpan.</p>
            ) : (
              <div>
                {entries.map(([key, value]) => <ValueRow key={key} label={key} value={value} />)}
              </div>
            )}
            {detail.notes && (
              <div className="mt-3 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">{detail.notes}</div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
