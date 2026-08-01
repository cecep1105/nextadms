import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikNetwatchItem } from "@/types/api";
import { AddPortalNetwatchButton } from "./_components/add-portal-netwatch-button";
import { EditPortalNetwatchButton } from "./_components/edit-portal-netwatch-button";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

async function getNetwatch(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikNetwatchItem>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MikrotikNetwatchItem>>(`/netmgmt/portal/netwatch/?${params.toString()}`);
}

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  up: "success", down: "destructive", waiting: "warning", initializing: "secondary",
};

export default async function PortalNetwatchPage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getNetwatch(searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="Netwatch"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
        action={<AddPortalNetwatchButton />}
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari host / comment" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="host" label="Host" /></TableHead>
              <TableHead>Status</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="comment" label="Comment" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="since" label="Since" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada host ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.host}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[item.status] ?? "secondary"}>{item.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{item.comment ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{item.since}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EditPortalNetwatchButton item={item} />
                    </div>
                  </TableCell>
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
