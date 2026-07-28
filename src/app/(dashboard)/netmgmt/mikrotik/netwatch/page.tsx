import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikNetwatchItem } from "@/types/api";
import { NetwatchActionsMenu } from "./_components/netwatch-actions-menu";

const PAGE_SIZE = 10;
// Sama seperti dhcp/page.tsx -- env var server-only, default = nilai lama.
// PENTING: IP router netwatch BEDA dari dhcp/fwfilter (.1 vs .254) -- ini
// KEMUNGKINAN BESAR memang 2 router fisik BERBEDA (bukan salah ketik),
// makanya env var-nya SENGAJA dipisah per-halaman, bukan 1 env var yg dishare.
const ROUTER_IP = process.env.MIKROTIK_NETWATCH_ROUTER_IP || "10.100.202.1";
const BASE_PATH = `/netmgmt/routeros/${ROUTER_IP}/tool-netwatch`;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getNetwatchItems(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikNetwatchItem>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set("_sort_by", sortBy);
  if (sortDir) queryParams.set("_order", sortDir);
  if (q) queryParams.set("_q", q);
  if (page) queryParams.set("_page", page);
  if (page_size) queryParams.set("_limit", page_size);
  queryParams.set("_search_fields", "host,comment");

  return apiServerFetch<Paginated<MikrotikNetwatchItem>>(`${BASE_PATH}/?${queryParams.toString()}`);
}

export default async function MikrotikNetwatchPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);
  const data = await getNetwatchItems(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Mikrotik Netwatch" description="Mikrotik Host Monitoring" />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari Host / Comment" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="id" label="id" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="host" label="Host" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="status" label="Status" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="since" label="Since" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="disabled" label="Disabled?" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="comment" label="Comment" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada host netwatch ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((netwatch) => (
                <TableRow key={netwatch.id}>
                  <TableCell className="text-muted-foreground">{netwatch.id}</TableCell>
                  <TableCell className="text-muted-foreground">{netwatch.host}</TableCell>
                  <TableCell className="text-muted-foreground">{netwatch.status ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{netwatch.since ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{netwatch.disabled ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{netwatch.comment ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <NetwatchActionsMenu hostdata={netwatch} basepath={BASE_PATH} />
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
