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
 * Tambah user Active Directory -- alur bikin user AD BUKAN 1 langkah
 * (lihat netmgmt/active_directory_view.py::ADUserCreateView): user
 * dibuat NONAKTIF dulu, password di-set, BARU diaktifkan. Kalau password
 * gagal (mis. tidak memenuhi kebijakan AD), user TETAP tersimpan tapi
 * nonaktif -- pesan error dari backend akan menjelaskan ini.
 */
export function AddAdUserDialog() {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function reset() {
    setUsername(""); setDisplayName(""); setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/netmgmt/ad/users/create/", {
        method: "POST",
        body: JSON.stringify({ username, display_name: displayName, first_name: firstName, last_name: lastName, email, password }),
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
            <DialogTitle>Tambah User Active Directory</DialogTitle>
            <DialogDescription>Username jadi sAMAccountName. Password wajib memenuhi kebijakan AD (kompleksitas/panjang minimum).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label htmlFor="ad-username">Username</Label>
              <Input id="ad-username" required value={username} onChange={(e) => setUsername(e.target.value)} className="font-mono" placeholder="budi.santoso" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-display-name">Nama Lengkap (Display Name)</Label>
              <Input id="ad-display-name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Budi Santoso" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ad-first-name">Nama Depan</Label>
                <Input id="ad-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Budi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-last-name">Nama Belakang</Label>
                <Input id="ad-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Santoso" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-email">Email</Label>
              <Input id="ad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="budi.santoso@contoso.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-password">Password Awal</Label>
              <Input id="ad-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
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
