import { Cpu, Wifi, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, ActiveDevice, Department } from "@/types/api";
import { DeviceFormDialog } from "./_components/device-form-dialog";
import { DeleteDeviceButton } from "./_components/delete-device-button";
import { DeviceActionsMenu } from "./_components/device-actions-menu";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/active-devices";

function isRecentlyActive(lastActivity: string | null): boolean {
  if (!lastActivity) return false;
  return Date.now() - new Date(lastActivity).getTime() < 5 * 60 * 1000;
}

export default async function ActiveDevicesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; ordering?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const ordering = searchParams.ordering ?? "";

  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);
  if (ordering) query.set("ordering", ordering);

  const [devicesData, departmentsData] = await Promise.all([
    apiServerFetch<Paginated<ActiveDevice>>(`/iclock/active-device/?${query.toString()}`),
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
  ]);

  return (
    <div>
      <PageHeader
        title="Active Device"
        description="Device fingerprint yang terhubung & aktif berkomunikasi via PUSH SDK."
        action={<DeviceFormDialog mode="create" departments={departmentsData.results} />}
      />

      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari SN / Alias..." />
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
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devicesData.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Tidak ada device ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              devicesData.results.map((device) => {
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
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <DeviceFormDialog mode="edit" device={device} departments={departmentsData.results} />
                        <DeviceActionsMenu sn={device.SN} alias={device.Alias} />
                        <DeleteDeviceButton sn={device.SN} alias={device.Alias} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <PaginationBar
          count={devicesData.count}
          pageSize={PAGE_SIZE}
          currentPage={Number(page)}
          basePath={BASE_PATH}
          searchParams={{ q: search, ordering }}
        />
      </Card>
    </div>
  );
}
