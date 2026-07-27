import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "./_components/search-bar";
import { PaginationBar } from "./_components/pagination-bar";
import SortableHeader from  "./_components/sortable-header";

import { Card } from "@/components/ui/card";
import { FwFilterActionsMenu } from "./_components/fwfilter-actions-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikFirewallFilterRule } from "@/types/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const BASE_PATH = "/netmon/mikrotik/10.100.202.254/ip-firewall-filter/";

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}


async function getFwFilter(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikFirewallFilterRule>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set('_sort_by', sortBy);
  if (sortDir) queryParams.set('_order', sortDir);
  if (q) queryParams.set('_q',q)
  if (page) queryParams.set('_page', page);
  if (page_size) queryParams.set('_limit', page_size);

  queryParams.set('_search_fields','src-mac-address,comment');

  const data = await apiServerFetch<Paginated<MikrotikFirewallFilterRule>>(
    `/netmon/mikrotik/10.100.202.254/ip-firewall-filter/?${queryParams.toString()}`,
    {
      cache: 'no-store',
    },
  );

  return data;
}

export default async function  MikrotikDhcpPage({ searchParams }: PageProps ) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);

  const data = await getFwFilter(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);
  return (
    <div>
      <PageHeader
        title="NetMon / Mikrotik FWFILTER"
        description="Daftar firewall filter"
        // action={<DepartmentFormDialog mode="create" />}
      />
      <Card>
        <div className="g"></div>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari MAC / Comment" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader columnKey="id" label="id" /></TableHead>
              <TableHead><SortableHeader columnKey="chain" label="Chain" /></TableHead>
              <TableHead><SortableHeader columnKey="action" label="Action" /></TableHead>
              <TableHead><SortableHeader columnKey="src-mac-address" label="Source Mac" /></TableHead>
              <TableHead><SortableHeader columnKey="out-interface" label="Out Interface" /></TableHead>
              <TableHead><SortableHeader columnKey="disabled" label="Disable?" /></TableHead>              
              <TableHead><SortableHeader columnKey="comment" label="Comment" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((fwfilter) => (
                <TableRow key={fwfilter.id} className="py-1">
                  <TableCell className="text-muted-foreground">{fwfilter.id}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.chain}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.action ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter['src-mac-address'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter['out-interface'] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter['disabled'] === 'true'? 'yes' : 'no'}</TableCell>                  
                  <TableCell className={cn("text-muted-foreground",{"text-destructive": fwfilter['disabled'] === 'true'})}>{fwfilter['comment'] ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <FwFilterActionsMenu hostdata={fwfilter}  />
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