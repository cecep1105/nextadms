import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "./_components/search-bar";
import { PaginationBar } from "./_components/pagination-bar";
import SortableHeader from  "./_components/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikNetwatchItem } from "@/types/api";
import { NetwatchActionsMenu } from "./_components/netwatch-actions-menu";

const PAGE_SIZE = 10;
const ROUTER_IP = '10.100.202.1'
const BASE_PATH = `/netmgmt/routeros/${ROUTER_IP}/tool-netwatch`;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}


async function getNetwatchItems(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikroTikNetwatchItem>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set('_sort_by', sortBy);
  if (sortDir) queryParams.set('_order', sortDir);
  if (q) queryParams.set('_q',q)
  if (page) queryParams.set('_page', page);
  if (page_size) queryParams.set('_limit', page_size);

  queryParams.set('_search_fields','host,comment');


  const data = await apiServerFetch<Paginated<MikrotikNetwatchItem>>(
    `${BASE_PATH}/?${queryParams.toString()}`,
    {
      cache: 'no-store',
    },
  );

  return data;
}

export default async function  MikrotikDhcpPage({ searchParams }: PageProps ) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);

  const data = await getNetwatchItems(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);
  return (
    <div>
      <PageHeader
        title="NetMgmt / Mikrotik Netwatch"
        description="Mikrotik Host Monitoring"
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
              <TableHead><SortableHeader columnKey="id" label="id" /></TableHead>
              <TableHead><SortableHeader columnKey="host" label="Host" /></TableHead>
              <TableHead><SortableHeader columnKey="status" label="Status" /></TableHead>
              <TableHead><SortableHeader columnKey="since" label="Since" /></TableHead>
              <TableHead><SortableHeader columnKey="disabled" label="Disabled?" /></TableHead>
              <TableHead><SortableHeader columnKey="comment" label="Comment" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((netwatch) => (
                <TableRow key={netwatch.id} className="py-1">
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
        <PaginationBar count={data.count} pageSize={pageSize} currentPage={Number(resolvedParams.page ?? "1")} basePath={BASE_PATH} />
      </Card>
    </div>
  );
}