import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikDhcpLease } from "@/types/api";

const PAGE_SIZE = 20;
const BASE_PATH = "/netmon/mikrotik/10.100.202.254/ip-dhcp_server-lease/";

export default async function  MikrotikDhcpPage({ searchParams }: { searchParams: { page?: string, sort_by?: string, order?: string } }) {
  const page = searchParams.page || '1';
  const sortBy = searchParams.sort_by || 'id';
  const order = searchParams.order || 'asc';
  const perPage = 10;

  const data = await apiServerFetch<Paginated<MikrotikDhcpLease>>(`/netmon/mikrotik/10.100.202.254/ip-dhcp_server-lease?_limit=${perPage}`);
  // const data = await apiServerFetch(`/netmon/mikrotik/10.100.202.254/ip-dhcp_server-lease/?limit=10&sort_by=${sortBy}&order=${order}`);
  return (
    <div>
      <PageHeader
        title="NetMon / Mikrotik DHCP"
        description="Daftar lease dhcp-server"
        // action={<DepartmentFormDialog mode="create" />}
      />
      <Card>
        <div className="g"></div>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari Pool ID / Code / Nama..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hostname</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Hostname</TableHead>

              <TableHead>Hostname</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Dynamic</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((dhcp) => (
                <TableRow key={dhcp.id}>
                  <TableCell className="font-mono">{dhcp.address}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{dhcp['mac-address'] ?? "-"}</TableCell>
                  <TableCell className="font-medium">{dhcp.server ?? "-"}</TableCell>
                  <TableCell className="font-medium">{dhcp['host-name'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp['last-seen'] ?? "-"}</TableCell>
                  <TableCell className="font-medium">{dhcp.dynamic ?? "-"}</TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath={BASE_PATH} searchParams={{ q: 'searc' }} />
      </Card>
    </div>
  );
}