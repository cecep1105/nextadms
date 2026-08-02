import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikDhcpLease } from "@/types/api";

// Data LANGSUNG dari router Mikrotik (bukan database Django), WAJIB dynamic.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;



async function getDhcpLease(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikDhcpLease>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MikrotikDhcpLease>>(`/netmgmt/portal/dhcp-lease/?${params.toString()}`);
}

export default async function PortalDhcpLeasePage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getDhcpLease(searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="DHCP Lease"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }

      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari IP Address / MAC / Hostname" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="address" label="IP Address" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="mac-address" label="MAC Address" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="host-name" label="Hostname" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="last-seen" label="Last Seen" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada lease ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((dhcp) => (
                <TableRow key={dhcp.id}>
                  <TableCell className="text-muted-foreground">{dhcp.address}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["mac-address"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["host-name"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{dhcp["last-seen"] ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
