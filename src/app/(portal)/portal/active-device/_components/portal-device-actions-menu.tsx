"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Fingerprint, Loader2, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import { LiveLogsDialog } from "@/app/(dashboard)/iclock/active-devices/_components/live-logs-dialog";
import { DeviceTransferFingerDialog } from "@/app/(dashboard)/iclock/active-devices/_components/device-transfer-finger-dialog";
import type { Department, ActiveDevice } from "@/types/api";

/**
 * Versi PORTAL dari DeviceActionsMenu (staff) -- CUMA 3 tombol (Sync
 * Waktu, Live Logs, Transfer Finger dari Device Ini), TIDAK ADA Live
 * Users/Backup Fingerprint/Network Params/Generic Param/Reboot
 * (SEMUA itu di luar cakupan izin portal can_view_active_device,
 * endpoint-nya SENGAJA TETAP staff-only).
 *
 * LiveLogsDialog & DeviceTransferFingerDialog DIPAKAI ULANG apa
 * adanya dari staff -- generik, tidak ada logic khusus staff.
 */
export function PortalDeviceActionsMenu({
  sn, alias, departments, devices,
}: {
  sn: string;
  alias: string;
  departments: Department[];
  devices: ActiveDevice[];
}) {
  const router = useRouter();
  const { request } = useApiClient();

  const [syncTimeLoading, setSyncTimeLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [liveLogsOpen, setLiveLogsOpen] = useState(false);
  const [transferFingerOpen, setTransferFingerOpen] = useState(false);

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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleSyncTime} disabled={syncTimeLoading} aria-label="Sync Waktu Device">
              {syncTimeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLiveLogsOpen(true)} aria-label="Lihat Live Logs">
              <ScrollText className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTransferFingerOpen(true)} aria-label="Transfer Finger">
              <Fingerprint className="h-3.5 w-3.5" />
            </Button>
          </div>
        </PopoverTrigger>
        {actionResult && (
          <PopoverContent className={`w-72 text-xs ${actionResult.success ? "text-success" : "text-destructive"}`}>
            {actionResult.message}
          </PopoverContent>
        )}
      </Popover>

      <LiveLogsDialog sn={sn} alias={alias} open={liveLogsOpen} onOpenChange={setLiveLogsOpen} />
      <DeviceTransferFingerDialog
        sn={sn} alias={alias} departments={departments} devices={devices}
        open={transferFingerOpen} onOpenChange={setTransferFingerOpen}
      />
    </>
  );
}
