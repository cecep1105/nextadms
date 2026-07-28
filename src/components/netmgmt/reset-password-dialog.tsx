"use client";
import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/**
 * Dialog reset password, DIPAKAI BERSAMA Active Directory & Zentyal
 * (parameterized lewat `source`) -- body request beda dikit tapi
 * bentuknya cukup mirip utk 1 komponen: {user_dn, new_password}.
 *
 * PENTING beda krusial di baliknya (lihat netmgmt/ldap_utils.py::set_password
 * sisi Django): AD WAJIB koneksi terenkripsi (LDAPS/StartTLS) utk operasi
 * ini -- kalau AD_USE_SSL=False, backend akan MENOLAK dgn pesan jelas,
 * ditampilkan APA ADANYA di dialog ini (bukan disamarkan).
 */
export function ResetPasswordDialog({
  source, userDn, userLabel, open, onOpenChange,
}: {
  source: "ad" | "zentyal";
  userDn: string;
  userLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { request } = useApiClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    setLoading(true);
    try {
      await request(`/netmgmt/${source}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({ user_dn: userDn, new_password: newPassword }),
      });
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal reset password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password — {userLabel}</DialogTitle>
          <DialogDescription>
            {source === "ad"
              ? "Password baru langsung aktif. Butuh koneksi terenkripsi (LDAPS/StartTLS) ke Active Directory -- akan gagal kalau server belum dikonfigurasi SSL."
              : "Password baru langsung aktif untuk login mail/LDAP Zentyal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          {success && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Password berhasil direset.</div>}

          <div className="space-y-1.5">
            <Label htmlFor="new_password">Password Baru</Label>
            <Input id="new_password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
            <Input id="confirm_password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Tutup</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
