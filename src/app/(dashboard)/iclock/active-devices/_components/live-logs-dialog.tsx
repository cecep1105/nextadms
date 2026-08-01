"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { DeviceLiveLog } from "@/types/api";

const PAGE_SIZE = 10;
type SortKey = "user_id" | "timestamp" | "status_label" | "punch_label";

function SortableTh({
  label, sortKey, currentSort, currentDir, onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <TableHead>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active ? (currentDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </TableHead>
  );
}

/**
 * "Live Logs" -- padanan LiveUsersDialog, TAPI utk log absensi yang
 * MASIH TERSIMPAN DI MEMORI DEVICE saat ini (koneksi langsung via pyzk,
 * BEDA dari tabel `transaction` di database).
 *
 * ⚠️ KOREKSI dari versi awal: SEBELUMNYA search/sort/pagination
 * masing-masing memanggil ULANG endpoint backend (yang KONEK ULANG ke
 * device fisik & tarik SEMUA log dari memorinya lagi tiap kali) --
 * lambat, apalagi utk device dgn banyak log tersimpan, PALING terasa
 * pas klik "Selanjutnya" (device di-hubungi ulang cuma utk potong 10
 * baris berikutnya dari data yg SEBENARNYA SUDAH pernah diambil
 * lengkap). SEKARANG: fetch SEKALI SAJA (saat dialog dibuka / klik
 * "Muat Ulang" manual) minta SEMUA log sekaligus (`page_size` besar),
 * simpan penuh di state -- search/sort/pagination SETELAHNYA dikerjakan
 * MURNI di client (JS array, `useMemo`), TIDAK ada request jaringan
 * sama sekali, jadi instan.
 *
 * READ-ONLY (tidak ada aksi edit/hapus per baris, beda dari
 * LiveUsersDialog) -- cuma utk MELIHAT.
 */
export function LiveLogsDialog({
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
  const [allLogs, setAllLogs] = useState<DeviceLiveLog[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Default urutan PALING BARU dulu -- log yg paling relevan dilihat
  // pertama biasanya yg paling baru.
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function loadAllLogs() {
    setLoading(true);
    setError(null);
    try {
      // page_size BESAR -- minta SEMUA log device dlm 1 panggilan (BUKAN
      // beneran "paginated" dari sisi backend, cuma manfaatkan parameter
      // yg SUDAH ada supaya tidak perlu ubah endpoint sama sekali).
      const data = await request<{ count: number; results: DeviceLiveLog[] }>(
        `/iclock/active-device/${sn}/live-logs/?page_size=100000`
      );
      setAllLogs(data.results);
      setPage(1);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengambil log absensi dari device."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadAllLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sn]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "timestamp" ? "desc" : "asc"); }
    setPage(1);
  }

  function formatTimestamp(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID");
  }

  // Search + sort + pagination -- SEMUA di client, dihitung ulang cuma
  // saat input yg relevan berubah (useMemo), TANPA request jaringan.
  const filteredSorted = useMemo(() => {
    let result = allLogs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((l) => String(l.user_id ?? "").toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [allLogs, search, sortKey, sortDir]);

  const count = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageLogs = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Logs — {alias}</DialogTitle>
          <DialogDescription>
            Log absensi yang MASIH TERSIMPAN di memori device saat ini (koneksi langsung, bukan dari database -- bisa jadi belum sempat terkirim ke server).
            Diambil sekali saat dibuka -- pencarian/pengurutan/halaman berikutnya semuanya instan (tanpa hubungi device lagi).
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari PIN..."
            className="flex-1"
            disabled={loading}
          />
          <Button variant="outline" size="icon" onClick={loadAllLogs} disabled={loading} aria-label="Muat ulang dari device">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh label="PIN" sortKey="user_id" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="Waktu" sortKey="timestamp" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="Status" sortKey="status_label" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="Verifikasi" sortKey="punch_label" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : pageLogs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Tidak ada log ditemukan.</TableCell></TableRow>
              ) : (
                pageLogs.map((l, i) => (
                  <TableRow key={`${l.user_id}-${l.timestamp}-${i}`}>
                    <TableCell className="font-mono">{l.user_id}</TableCell>
                    <TableCell className="font-tabular text-muted-foreground">{formatTimestamp(l.timestamp)}</TableCell>
                    <TableCell><Badge variant="secondary">{l.status_label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{l.punch_label}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{count} log{search.trim() ? ` (dari ${allLogs.length} total)` : ""}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Sebelumnya</Button>
            <span className="font-tabular">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Selanjutnya</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
