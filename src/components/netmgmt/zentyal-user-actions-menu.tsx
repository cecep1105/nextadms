"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Power, Trash2, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import { ResetPasswordDialog } from "@/components/netmgmt/reset-password-dialog";

/**
 * Zentyal/POSIX TIDAK PUNYA bit "disabled" spt AD -- toggle status di
 * sini bekerja lewat prefix '!' di userPassword (konvensi Unix standar,
 * sama dgn `passwd -l`), lihat netmgmt/zentyal_view.py::ZentyalUserToggleStatusView.
 */
export function ZentyalUserActionsMenu({
  userDn, userLabel, isEnabled,
}: {
  userDn: string;
  userLabel: string;
  isEnabled: boolean;
}) {
  const router = useRouter();
  const { request } = useApiClient();

  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const action = isEnabled ? "disable" : "enable";

  async function handleToggle() {
    setToggleLoading(true);
    setToggleError(null);
    try {
      await request("/netmgmt/zentyal/users/toggle-status/", {
        method: "POST",
        body: JSON.stringify({ user_dn: userDn, action }),
      });
      setToggleConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setToggleError(extractErrorMessage(err, `Gagal ${isEnabled ? "menonaktifkan" : "mengaktifkan"} user.`));
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await request("/netmgmt/zentyal/users/delete/", {
        method: "POST",
        body: JSON.stringify({ user_dn: userDn }),
      });
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Gagal menghapus user."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Aksi User">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            <KeyRound className="mr-3 h-3.5 w-3.5" /> Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setToggleConfirmOpen(true)}>
            <Power className="mr-3 h-3.5 w-3.5" /> {isEnabled ? "Nonaktifkan" : "Aktifkan"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-3 h-3.5 w-3.5" /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetPasswordDialog source="zentyal" userDn={userDn} userLabel={userLabel} open={resetPasswordOpen} onOpenChange={setResetPasswordOpen} />

      <Dialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEnabled ? "Nonaktifkan" : "Aktifkan"} User?</DialogTitle>
            <DialogDescription>
              {isEnabled
                ? <>Akun <span className="font-medium text-foreground">{userLabel}</span> akan dinonaktifkan -- tidak bisa login/autentikasi sampai diaktifkan kembali.</>
                : <>Akun <span className="font-medium text-foreground">{userLabel}</span> akan diaktifkan kembali.</>}
            </DialogDescription>
          </DialogHeader>
          {toggleError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{toggleError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleConfirmOpen(false)}>Batal</Button>
            <Button variant={isEnabled ? "destructive" : "default"} onClick={handleToggle} disabled={toggleLoading}>
              {toggleLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {isEnabled ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus User?</DialogTitle>
            <DialogDescription>
              User <span className="font-medium text-foreground">{userLabel}</span> akan dihapus PERMANEN dari LDAP, tidak ada undo.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{deleteError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
