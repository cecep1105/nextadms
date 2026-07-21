import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, RegisteredDevice, Department } from "@/types/api";
import { RegisteredDeviceFormDialog } from "./_components/registered-device-form-dialog";

const PAGE_SIZE = 20;

export default async function RegisteredDevicesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.search ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("search", search);

  const [data, departmentsData] = await Promise.all([
    apiServerFetch<Paginated<RegisteredDevice>>(`/iclock/registered-device/?${query.toString()}`),
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
  ]);

  return (
    <div>
      <PageHeader
        title="Registered Device"
        description="Device baru yang auto-terdaftar (Rule 2a) tapi belum diaktivasi ke Pool manapun."
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari SN / nama device..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SN</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Nama Device</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada registered device.</TableCell></TableRow>
            ) : (
              data.results.map((rd) => (
                <TableRow key={rd.id}>
                  <TableCell className="font-mono">{rd.SN}</TableCell>
                  <TableCell className="text-muted-foreground">{rd.Alias ?? "-"}</TableCell>
                  <TableCell className="font-medium">{rd.DeviceName || "-"}</TableCell>
                  <TableCell>
                    {!rd.DeptID || rd.DeptID === 0 ? (
                      <Badge variant="warning">Belum aktivasi</Badge>
                    ) : (
                      <span className="text-muted-foreground">{rd.DeptID}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{rd.IPAddress ?? "-"}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">
                    {rd.LastActivity ? new Date(rd.LastActivity).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <RegisteredDeviceFormDialog device={rd} departments={departmentsData.results} />
                      <DeleteConfirmButton endpoint={`/iclock/registered-device/${rd.id}/`} label={`Registered Device '${rd.SN}'`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath="/iclock/registered-devices" searchParams={{ search }} />
      </Card>
    </div>
  );
}
