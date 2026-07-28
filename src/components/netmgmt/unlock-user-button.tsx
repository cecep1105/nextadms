"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/**
 * Unlock akun AD yang terkunci OTOMATIS (lockoutTime != 0, krn salah
 * password berkali-kali) -- BEDA dari enable/disable (lihat
 * toggle-user-status-button.tsx), itu status MANUAL admin, konsep terpisah.
 */
export function UnlockUserButton({ userDn, userLabel }: { userDn: string; userLabel: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await request("/netmgmt/ad/users/unlock/", {
        method: "POST",
        body: JSON.stringify({ user_dn: userDn }),
      });
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal unlock user."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        <LockOpen className="h-3.5 w-3.5" /> Unlock
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock User?</DialogTitle>
            <DialogDescription>
              Akun <span className="font-medium text-foreground">{userLabel}</span> akan dibuka kuncinya dan bisa login lagi.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
