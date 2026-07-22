"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Power, Clock, HardDriveDownload, Users, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import { BackupFingerprintsDialog } from "./backup-fingerprints-dialog";
import { LiveUsersDialog } from "./live-users-dialog";

export function DeviceActionsMenu({ sn, alias }: { sn: string; alias: string }) {
  const router = useRouter();
  const { request } = useApiClient();

  const [rebootConfirmOpen, setRebootConfirmOpen] = useState(false);
  const [rebootLoading, setRebootLoading] = useState(false);
  const [syncTimeLoading, setSyncTimeLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [liveUsersOpen, setLiveUsersOpen] = useState(false);

  async function handleReboot() {
    setRebootLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${sn}/reboot/`, { method: "POST" });
      setActionResult(result);
      setRebootConfirmOpen(false);
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal reboot device.") });
    } finally {
      setRebootLoading(false);
    }
  }

  async function handleSyncTime() {
    setSyncTimeLoading(true);
    setActionResult(null);
    try {
      const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${sn}/sync-time/`, { method: "POST" });
      setActionResult(result);
      if (result.success) router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal sinkronisasi waktu.") });
    } finally {
      setSyncTimeLoading(false);
    }
  }

  return (
    <>
      <Popover open={!!actionResult} onOpenChange={(open) => !open && setActionResult(null)}>
        <PopoverTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aksi Device">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSyncTime} disabled={syncTimeLoading}>
                {syncTimeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                Sync Waktu Device
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLiveUsersOpen(true)}>
                <Users className="h-3.5 w-3.5" /> Lihat Live Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBackupOpen(true)}>
                <HardDriveDownload className="h-3.5 w-3.5" /> Backup Fingerprint
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRebootConfirmOpen(true)} className="text-destructive focus:text-destructive">
                <Power className="h-3.5 w-3.5" /> Reboot Device
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PopoverTrigger>
        {actionResult && (
          <PopoverContent className={`w-72 text-xs ${actionResult.success ? "text-success" : "text-destructive"}`}>
            {actionResult.message}
          </PopoverContent>
        )}
      </Popover>

      <Dialog open={rebootConfirmOpen} onOpenChange={setRebootConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reboot Device?</DialogTitle>
            <DialogDescription>
              Device <span className="font-mono font-medium text-foreground">{sn}</span> ({alias}) akan restart.
              Absensi via device ini TIDAK BISA diproses selama proses reboot berlangsung (biasanya 30-60 detik).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRebootConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReboot} disabled={rebootLoading}>
              {rebootLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Reboot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BackupFingerprintsDialog sn={sn} alias={alias} open={backupOpen} onOpenChange={setBackupOpen} />
      <LiveUsersDialog sn={sn} alias={alias} open={liveUsersOpen} onOpenChange={setLiveUsersOpen} />
    </>
  );
}
