"use client";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck, Shield, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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
import type { DeviceLiveUser } from "@/types/api";

const PRIVILEGE_ADMIN = 14;
const PAGE_SIZE = 10;
type SortKey = "user_id" | "name" | "privilege";

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

export function LiveUsersDialog({
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
  const [users, setUsers] = useState<DeviceLiveUser[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("user_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page), page_size: String(PAGE_SIZE), sort: sortKey, dir: sortDir,
      });
      // Backend punya 2 filter TERPISAH (?pin= & ?name=, sequential AND
      // -- BUKAN "atau") -- 1 search box di sini pilih SALAH SATU sesuai
      // bentuk inputnya: semua digit -> filter by pin, selain itu -> nama.
      if (debouncedSearch) {
        if (/^\d+$/.test(debouncedSearch)) params.set("pin", debouncedSearch);
        else params.set("name", debouncedSearch);
      }
      const data = await request<{ count: number; page: number; page_size: number; results: DeviceLiveUser[] }>(
        `/iclock/active-device/${sn}/live-users/?${params.toString()}`
      );
      setUsers(data.results);
      setCount(data.count);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengambil daftar user dari device."));
    } finally {
      setLoading(false);
    }
  }

  // Debounce input pencarian (400ms) SEBELUM benar2 dipakai fetch --
  // `search` (raw, tiap keystroke) dipakai binding <Input> biar tidak lag,
  // `debouncedSearch` (versi tertunda) yang dipakai query beneran.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handle);
  }, [search]);

  // Reset ke halaman 1 tiap kali PENCARIAN (bukan tiap keystroke -- sudah
  // di-debounce di atas) berubah.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sn, page, sortKey, sortDir, debouncedSearch]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function handleTogglePrivilege(u: DeviceLiveUser) {
    setBusyUserId(u.user_id);
    try {
      await request(`/iclock/active-device/${sn}/user-toggle-privilege/`, {
        method: "POST",
        body: JSON.stringify({ user_id: u.user_id, current_privilege: u.privilege }),
      });
      await loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah privilege user."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDeleteUser(u: DeviceLiveUser) {
    if (!confirm(`Hapus user '${u.user_id}' (${u.name}) dari device fisik '${alias}'? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyUserId(u.user_id);
    try {
      await request(`/iclock/active-device/${sn}/user-delete/`, {
        method: "POST",
        body: JSON.stringify({ user_id: u.user_id }),
      });
      await loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus user dari device."));
    } finally {
      setBusyUserId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Users — {alias}</DialogTitle>
          <DialogDescription>
            Daftar user yang BENAR-BENAR tersimpan di memori device saat ini (koneksi langsung, bukan dari database).
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

        <div className="flex items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari PIN (angka) / nama..." className="flex-1" />
          <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading} aria-label="Muat ulang">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh label="PIN" sortKey="user_id" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="Nama" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="Privilege" sortKey="privilege" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono">{u.user_id}</TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>
                      {u.privilege === PRIVILEGE_ADMIN ? <Badge variant="default">Admin</Badge> : <Badge variant="secondary">User</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => handleTogglePrivilege(u)} disabled={busyUserId === u.user_id}>
                          {busyUserId === u.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.privilege === PRIVILEGE_ADMIN ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u)} disabled={busyUserId === u.user_id}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{count} user total</span>
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
