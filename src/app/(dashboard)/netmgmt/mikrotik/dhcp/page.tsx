import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { DhcpActionsMenu } from "./_components/dhcp-actions-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikDhcpLease } from "@/types/api";

const PAGE_SIZE = 10;
// Env var SERVER-ONLY (bukan NEXT_PUBLIC_, ini cuma dipakai fetch di
// Server Component/apiServerFetch, tidak pernah sampai ke browser) --
// default PERSIS nilai yang sebelumnya hardcode, jadi TIDAK mengubah
// perilaku existing kalau env var belum diisi. Isi MIKROTIK_DHCP_ROUTER_IP
// di .env kalau router DHCP-nya beda dari default ini.
const ROUTER_IP = process.env.MIKROTIK_DHCP_ROUTER_IP || "10.100.202.254";
const BASE_PATH = `/netmgmt/routeros/${ROUTER_IP}/ip-dhcp_server-lease`;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getDhcpLease(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikDhcpLease>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set("_sort_by", sortBy);
  if (sortDir) queryParams.set("_order", sortDir);
  if (q) queryParams.set("_q", q);
  if (page) queryParams.set("_page", page);
  if (page_size) queryParams.set("_limit", page_size);
  queryParams.set("_search_fields", "address,mac-address,host-name");

  return apiServerFetch<Paginated<MikrotikDhcpLease>>(`${BASE_PATH}/?${queryParams.toString()}`);
}

export default async function MikrotikDhcpPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);
  const data = await getDhcpLease(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Mikrotik DHCP" description="Daftar lease dhcp-server" />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari IP Address / MAC / Hostname" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="address" label="IP Address" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="mac-address" label="MAC Address" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="server" label="Server" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="host-name" label="Hostname" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="last-seen" label="Last Seen" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="dynamic" label="Dynamic" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada lease ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((dhcp) => (
                <TableRow key={dhcp.id}>
                  <TableCell className="text-muted-foreground">{dhcp.address}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["mac-address"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp.server ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["host-name"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["last-seen"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp.dynamic ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <DhcpActionsMenu hostdata={dhcp} basepath={BASE_PATH} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(resolvedParams.page ?? "1")} />
      </Card>
    </div>
  );
}
