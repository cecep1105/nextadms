import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, ActiveDevice, Department } from "@/types/api";
import { PortalDeviceActionsMenu } from "./_components/portal-device-actions-menu";

// Versi SEDERHANA (server-rendered biasa) dari halaman Active Device
// staff -- SENGAJA TIDAK pakai IclockWsProvider/live-update WebSocket
// spt staff, utk cakupan portal V1 ini cukup lihat status apa adanya
// + 3 aksi yg disepakati (sync jam, live log, transfer finger) -- bisa
// diperluas nanti kalau live-update real-time dibutuhkan juga di portal.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function PortalActiveDevicePage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.page) params.set("page", searchParams.page);
  params.set("page_size", String(PAGE_SIZE));

  const [devicesData, departmentsData, allDevicesData] = await Promise.all([
    apiServerFetch<Paginated<ActiveDevice>>(`/iclock/active-device/?${params.toString()}`),
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
    apiServerFetch<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"),
  ]);

  return (
    <div>
      <PageHeader
        title="Active Device"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari SN / Alias" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SN</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devicesData.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada device ditemukan.</TableCell></TableRow>
            ) : (
              devicesData.results.map((device) => (
                <TableRow key={device.SN}>
                  <TableCell className="font-mono">{device.SN}</TableCell>
                  <TableCell className="font-medium">{device.Alias}</TableCell>
                  <TableCell><Badge variant="secondary">{device.DeptName || "-"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{device.IPAddress || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.LastActivity ? new Date(device.LastActivity).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <PortalDeviceActionsMenu sn={device.SN} alias={device.Alias} departments={departmentsData.results} devices={allDevicesData.results} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={devicesData.count} pageSize={PAGE_SIZE} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
