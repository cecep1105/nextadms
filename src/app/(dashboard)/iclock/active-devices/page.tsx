import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card } from "@/components/ui/card";
import { apiServerFetch } from "@/lib/api-server";
import { IclockWsProvider } from "@/lib/iclock-ws-context";
import type { Paginated, ActiveDevice, Department } from "@/types/api";
import { DeviceFormDialog } from "./_components/device-form-dialog";
import { LiveDeviceTable } from "./_components/live-device-table";
import { WsConsolePanel } from "./_components/ws-console-panel";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/active-devices";

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

  const [devicesData, departmentsData, allDevicesData] = await Promise.all([
    apiServerFetch<Paginated<ActiveDevice>>(`/iclock/active-device/?${query.toString()}`),
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
    // Terpisah dari `devicesData` (list terpaginasi di atas, cuma ~20/halaman)
    // -- ini KHUSUS utk isi dropdown "Device Spesifik" di dialog Transfer
    // Finger, butuh SEMUA device tanpa terpotong halaman.
    apiServerFetch<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"),
  ]);

  return (
    <IclockWsProvider>
      <div>
        <PageHeader
          title="Active Device"
          description="Device fingerprint yang terhubung & aktif berkomunikasi via PUSH SDK. Kolom Status & Last Activity update REAL-TIME (WebSocket) tanpa perlu refresh."
          action={<DeviceFormDialog mode="create" departments={departmentsData.results} />}
        />

        <Card>
          <div className="flex items-center justify-between border-b border-border p-3">
            <SearchBar placeholder="Cari SN / Alias..." />
            <WsConsolePanel />
          </div>

          <LiveDeviceTable
            initialDevices={devicesData.results}
            departments={departmentsData.results}
            allDevices={allDevicesData.results}
            ordering={ordering}
            search={search}
          />

          <PaginationBar
            count={devicesData.count}
            pageSize={PAGE_SIZE}
            currentPage={Number(page)}
            basePath={BASE_PATH}
            searchParams={{ q: search, ordering }}
          />
        </Card>
      </div>
    </IclockWsProvider>
  );
}
