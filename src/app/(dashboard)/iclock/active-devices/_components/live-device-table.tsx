"use client";
import { useCallback, useState } from "react";
import { Wifi, WifiOff, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "@/components/shared/sortable-header";
import { useIclockWebSocket, type IclockWsMessage } from "@/lib/use-iclock-websocket";
import type { ActiveDevice, Department } from "@/types/api";
import { DeviceFormDialog } from "./device-form-dialog";
import { DeleteDeviceButton } from "./delete-device-button";
import { DeviceActionsMenu } from "./device-actions-menu";

const BASE_PATH = "/iclock/active-devices";

// SAMAKAN dgn iclock/views.py::ACTIVE_DEVICE_STALE_MINUTES (dashboard
// Django, default 60 menit) -- SEBELUMNYA saya pakai 5 menit sendiri,
// bikin status Online/Offline TIDAK KONSISTEN antara dashboard Django &
// Next.js utk device yang SAMA.
const STALE_MS = 60 * 60 * 1000;

function isRecentlyActive(lastActivity: string | null): boolean {
  if (!lastActivity) return false;
  const t = new Date(lastActivity).getTime();
  return !Number.isNaN(t) && Date.now() - t < STALE_MS;
}

function ConnectionIndicator({ status }: { status: "connecting" | "connected" | "disconnected" }) {
  const config = {
    connected: { color: "text-success", label: "Live -- update real-time aktif" },
    connecting: { color: "text-warning", label: "Menghubungkan ke server real-time..." },
    disconnected: { color: "text-muted-foreground", label: "Real-time terputus -- data tetap bisa dilihat, tapi tidak update otomatis" },
  }[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 text-[11px] ${config.color}`}>
          <Radio className="h-3 w-3" /> {status === "connected" ? "Live" : status === "connecting" ? "Menghubungkan..." : "Terputus"}
        </span>
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  );
}

export function LiveDeviceTable({
  initialDevices, departments, allDevices, ordering, search,
}: {
  initialDevices: ActiveDevice[];
  departments: Department[];
  allDevices: ActiveDevice[];
  ordering: string;
  search: string;
}) {
  const [devices, setDevices] = useState(initialDevices);

  const handleMessage = useCallback((msg: IclockWsMessage) => {
    const sn = msg.message?.sn as string | undefined;
    if (!sn) return;
    const la = msg.message?.la;
    const timestamp = typeof la === "string" ? la : new Date().toISOString();

    setDevices((prev) => {
      const idx = prev.findIndex((d) => d.SN === sn);
      if (idx === -1) return prev; // device ini tidak ada di halaman/list SAAT INI (mis. beda halaman pagination) -- abaikan

      // PENTING: nama section PERSIS 'device_request'/'device_attlog' --
      // BUKAN 'request'/'attlog' (lihat iclock/ws_utils.py & broadcast di
      // iclock/pushsdk_views.py) -- salah ketik ini SEBELUMNYA bikin
      // update tidak pernah ke-trigger sama sekali.
      // - device_request (heartbeat/polling) -> update Last Activity
      // - device_attlog (ada transaksi/absensi baru) -> update Last Data
      const updated = [...prev];
      if (msg.section === "device_request") {
        updated[idx] = { ...updated[idx], LastActivity: timestamp };
      } else if (msg.section === "device_attlog") {
        updated[idx] = { ...updated[idx], LastData: timestamp };
      } else {
        return prev; // section lain (kalau ada) -- tidak relevan utk tabel ini
      }
      return updated;
    });
  }, []);

  const { status } = useIclockWebSocket(handleMessage);

  return (
    <>
      <div className="flex items-center justify-end border-b border-border px-3 py-1.5">
        <ConnectionIndicator status={status} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead><SortableHeader label="SN" sortKey="SN" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
            <TableHead><SortableHeader label="Alias" sortKey="Alias" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
            <TableHead>Pool</TableHead>
            <TableHead><SortableHeader label="IP Address" sortKey="IPAddress" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
            <TableHead>Push Ver</TableHead>
            <TableHead>Realtime</TableHead>
            <TableHead><SortableHeader label="Last Activity" sortKey="LastActivity" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
            <TableHead title="Waktu transaksi/absensi TERAKHIR dari device ini (beda dari Last Activity yang cuma heartbeat/polling)">Last Data</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                Tidak ada device ditemukan.
              </TableCell>
            </TableRow>
          ) : (
            devices.map((device) => {
              const online = isRecentlyActive(device.LastActivity);
              return (
                <TableRow key={device.SN}>
                  <TableCell>
                    {online ? (
                      <Badge variant="success"><Wifi className="mr-1 h-2.5 w-2.5" /> Online</Badge>
                    ) : (
                      <Badge variant="secondary"><WifiOff className="mr-1 h-2.5 w-2.5" /> Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{device.SN}</TableCell>
                  <TableCell className="font-medium">{device.Alias}</TableCell>
                  <TableCell className="text-muted-foreground">{device.DeptName ?? "-"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{device.IPAddress ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{device.PushVersion ?? "-"}</TableCell>
                  <TableCell>
                    {device.Realtime ? (
                      <span className="text-success">Ya</span>
                    ) : (
                      <span className="text-muted-foreground">Tidak</span>
                    )}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">
                    {device.LastActivity ? new Date(device.LastActivity).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">
                    {device.LastData ? new Date(device.LastData).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <DeviceFormDialog mode="edit" device={device} departments={departments} />
                      <DeviceActionsMenu sn={device.SN} alias={device.Alias} departments={departments} devices={allDevices} />
                      <DeleteDeviceButton sn={device.SN} alias={device.Alias} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </>
  );
}
