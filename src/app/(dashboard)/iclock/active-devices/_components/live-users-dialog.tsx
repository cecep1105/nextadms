"use client";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck, Shield, Trash2 } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ count: number; results: DeviceLiveUser[] }>(
        `/iclock/active-device/${sn}/live-users/?page_size=1000`
      );
      setUsers(data.results);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengambil daftar user dari device."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sn]);

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

  const filtered = users.filter(
    (u) => !search || u.user_id.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari PIN / nama..." className="flex-1" />
          <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading} aria-label="Muat ulang">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PIN</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Privilege</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
                ) : (
                  filtered.map((u) => (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
