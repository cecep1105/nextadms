"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/**
 * Toggle enable/disable akun -- BEDA dari "unlock" (lihat
 * unlock-user-button.tsx di halaman Locked Users, KHUSUS AD): ini
 * status yang diubah MANUAL oleh admin (nonaktifkan/aktifkan akun),
 * bukan status lockout OTOMATIS krn salah password berkali-kali.
 *
 * `source` menentukan endpoint yang dipanggil -- SAMA pola dgn
 * ResetPasswordButton (dipakai bareng AD & Zentyal, PERILAKU beda di
 * backend: AD pakai bit userAccountControl, Zentyal pakai prefix '!'
 * di userPassword -- lihat masing2 view utk detail).
 */
export function ToggleUserStatusButton({
  source, userDn, userLabel, isEnabled,
}: {
  source: "ad" | "zentyal";
  userDn: string;
  userLabel: string;
  isEnabled: boolean;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = isEnabled ? "disable" : "enable";
  const endpoint = source === "ad" ? "/netmgmt/ad/users/toggle-status/" : "/netmgmt/zentyal/users/toggle-status/";

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await request(endpoint, {
        method: "POST",
        body: JSON.stringify({ user_dn: userDn, action }),
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, `Gagal ${isEnabled ? "menonaktifkan" : "mengaktifkan"} user.`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setConfirmOpen(true)}
        aria-label={isEnabled ? "Nonaktifkan" : "Aktifkan"}
        className={isEnabled ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
      >
        {isEnabled ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEnabled ? "Nonaktifkan" : "Aktifkan"} User?</DialogTitle>
            <DialogDescription>
              {isEnabled
                ? <>Akun <span className="font-medium text-foreground">{userLabel}</span> akan dinonaktifkan -- tidak bisa login sampai diaktifkan kembali.</>
                : <>Akun <span className="font-medium text-foreground">{userLabel}</span> akan diaktifkan kembali.</>}
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button variant={isEnabled ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {isEnabled ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
