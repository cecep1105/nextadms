"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, UserMinus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { DirectoryUser } from "@/types/api";

/**
 * Dialog kelola member group, DIPAKAI BERSAMA Active Directory & Zentyal
 * (parameterized lewat `source`) -- bentuk data konsisten (lihat
 * types/api.ts::DirectoryUser/DirectoryGroup), tapi body POST membership
 * SEDIKIT beda:
 *   - AD: {group_dn, user_dn, action}
 *   - Zentyal: {group_dn, user_uid, user_dn, action} -- backend Zentyal
 *     otomatis pilih user_uid ATAU user_dn tergantung jenis group (posix
 *     pakai memberUid/uid, distribution pakai member/DN) -- frontend
 *     cukup kirim KEDUANYA, tidak perlu tahu jenis groupnya.
 */
export function GroupMembersDialog({
  source, groupDn, groupName, open, onOpenChange,
}: {
  source: "ad" | "zentyal";
  groupDn: string;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [members, setMembers] = useState<DirectoryUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyDn, setBusyDn] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DirectoryUser[]>([]);
  const [searching, setSearching] = useState(false);

  async function loadMembers() {
    setError(null);
    try {
      const data = await request<{ count: number; results: DirectoryUser[] }>(
        `/netmgmt/${source}/groups/${encodeURIComponent(groupDn)}/members/`
      );
      setMembers(data.results);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal memuat member group."));
    }
  }

  useEffect(() => {
    if (open) {
      setMembers(null);
      setSearchQuery("");
      setSearchResults([]);
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groupDn]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await request<{ results: DirectoryUser[] }>(
          `/netmgmt/${source}/users/?_q=${encodeURIComponent(searchQuery)}&_search_fields=username,display_name,email&_limit=8`
        );
        // Sembunyikan user yang SUDAH jadi member -- tidak ada gunanya ditawarkan lagi.
        const memberDns = new Set((members ?? []).map((m) => m.dn));
        setSearchResults(data.results.filter((u) => !memberDns.has(u.dn)));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  async function handleAdd(user: DirectoryUser) {
    setBusyDn(user.dn);
    setError(null);
    try {
      await request(`/netmgmt/${source}/group-membership/`, {
        method: "POST",
        body: JSON.stringify({ group_dn: groupDn, user_dn: user.dn, user_uid: user.username, action: "add" }),
      });
      setSearchQuery("");
      setSearchResults([]);
      await loadMembers();
      router.refresh(); // supaya member_count di tabel Groups di belakang dialog ikut update
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menambah member."));
    } finally {
      setBusyDn(null);
    }
  }

  async function handleRemove(user: DirectoryUser) {
    setBusyDn(user.dn);
    setError(null);
    try {
      await request(`/netmgmt/${source}/group-membership/`, {
        method: "POST",
        body: JSON.stringify({ group_dn: groupDn, user_dn: user.dn, user_uid: user.username, action: "remove" }),
      });
      await loadMembers();
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus member."));
    } finally {
      setBusyDn(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Member — {groupName}</DialogTitle>
          <DialogDescription>Tambah atau hapus user dari group ini.</DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

        <div className="space-y-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari user utk ditambahkan..." className="pl-8" />
          </div>
          {searching && <p className="text-[11px] text-muted-foreground">Mencari...</p>}
          {searchResults.length > 0 && (
            <div className="space-y-1 rounded-md border border-border p-1">
              {searchResults.map((user) => (
                <div key={user.dn} className="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-accent">
                  <span>{user.display_name} <span className="font-mono text-muted-foreground">({user.username})</span></span>
                  <Button variant="ghost" size="icon" onClick={() => handleAdd(user)} disabled={busyDn === user.dn}>
                    {busyDn === user.dn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 text-success" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Member saat ini ({members?.length ?? 0})</p>
          {members === null ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Belum ada member di group ini.</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {members.map((user) => (
                <div key={user.dn} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium">{user.display_name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{user.username} {user.email && `• ${user.email}`}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(user)} disabled={busyDn === user.dn}>
                    {busyDn === user.dn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
