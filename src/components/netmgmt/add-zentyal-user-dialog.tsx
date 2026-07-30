"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/**
 * Tambah user Zentyal (mail server) -- uidNumber dihitung OTOMATIS
 * server-side (MAX+1 dari user yang ada, lihat netmgmt/zentyal_view.py
 * ::ZentyalUserCreateView), gidNumber pakai default yang dikonfigurasi
 * admin (ZENTYAL_DEFAULT_GID_NUMBER) -- tidak perlu diisi di form ini.
 */
export function AddZentyalUserDialog() {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function reset() {
    setUsername(""); setDisplayName(""); setLastName(""); setEmail(""); setPassword("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/netmgmt/zentyal/users/create/", {
        method: "POST",
        body: JSON.stringify({ username, display_name: displayName, last_name: lastName, email, password }),
      });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menambah user."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><UserPlus className="h-3.5 w-3.5" /> Tambah User</Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Zentyal</DialogTitle>
            <DialogDescription>uidNumber & home directory dibuat otomatis.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label htmlFor="zt-username">Username (uid)</Label>
              <Input id="zt-username" required value={username} onChange={(e) => setUsername(e.target.value)} className="font-mono" placeholder="budi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zt-display-name">Nama Lengkap</Label>
              <Input id="zt-display-name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Budi Santoso" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zt-last-name">Nama Belakang</Label>
              <Input id="zt-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Santoso" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zt-email">Email</Label>
              <Input id="zt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="budi@hibautama.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zt-password">Password Awal</Label>
              <Input id="zt-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Minimal 8 karakter.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Tambah User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
