import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "./_components/search-bar";
import { PaginationBar } from "./_components/pagination-bar";
import SortableHeader from  "./_components/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Card } from "@/components/ui/card";
import { DhcpActionsMenu } from "./_components/dhcp-actions-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikDhcpLease } from "@/types/api";

const PAGE_SIZE = 10;
const BASE_PATH = "/netmon/mikrotik/10.100.202.254/ip-dhcp_server-lease/";

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}


async function getDhcpLease(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikDhcpLease>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set('_sort_by', sortBy);
  if (sortDir) queryParams.set('_order', sortDir);
  if (q) queryParams.set('_q',q)
  if (page) queryParams.set('_page', page);
  if (page_size) queryParams.set('_limit', page_size);

  const data = await apiServerFetch<Paginated<MikrotikDhcpLease>>(
    `/netmon/mikrotik/10.100.202.254/ip-dhcp_server-lease/?${queryParams.toString()}`,
    {
      cache: 'no-store',
    },
  );

  return data;
}

export default async function  MikrotikDhcpPage({ searchParams }: PageProps ) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);

  const data = await getDhcpLease(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);
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
          <SearchBar placeholder="Cari IP Address / MAC / Hostname" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader columnKey="address" label="IP Address" /></TableHead>
              <TableHead><SortableHeader columnKey="mac_address" label="MAC Address" /></TableHead>
              <TableHead><SortableHeader columnKey="server" label="Server" /></TableHead>
              <TableHead><SortableHeader columnKey="host_name" label="Hostname" /></TableHead>
              <TableHead><SortableHeader columnKey="last_seen" label="Last Seen" /></TableHead>
              <TableHead><SortableHeader columnKey="dynamic" label="Dynamic" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((dhcp) => (
                <TableRow key={dhcp.id} className="py-1">
                  <TableCell className="text-muted-foreground">{dhcp.address}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp['mac-address'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp.server ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp['host-name'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp['last-seen'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp.dynamic ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <DhcpActionsMenu hostdata={dhcp}  />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={pageSize} currentPage={Number(resolvedParams.page ?? "1")} basePath={BASE_PATH} />
      </Card>
    </div>
  );
}