import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { FwFilterActionsMenu } from "./_components/fwfilter-actions-menu";
import { GrantAccessDialog } from "./_components/grant-access-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikFirewallFilterRule } from "@/types/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
// Sama seperti dhcp/page.tsx -- env var server-only, default = nilai lama.
const ROUTER_IP = process.env.MIKROTIK_FWFILTER_ROUTER_IP || "10.100.202.254";
const BASE_PATH = `/netmgmt/routeros/${ROUTER_IP}/ip-firewall-filter`;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getFwFilter(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikFirewallFilterRule>> {
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.set("_sort_by", sortBy);
  if (sortDir) queryParams.set("_order", sortDir);
  if (q) queryParams.set("_q", q);
  if (page) queryParams.set("_page", page);
  if (page_size) queryParams.set("_limit", page_size);
  queryParams.set("_search_fields", "src-mac-address,comment");

  return apiServerFetch<Paginated<MikrotikFirewallFilterRule>>(`${BASE_PATH}/?${queryParams.toString()}`);
}

export default async function MikrotikFwFilterPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const pageSize = Number(resolvedParams.page_size ?? PAGE_SIZE);
  const data = await getFwFilter(resolvedParams.sortBy, resolvedParams.sortDir, resolvedParams.page, resolvedParams.q, resolvedParams.page_size);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Mikrotik Firewall Filter"
        description="Daftar firewall filter"
        action={<GrantAccessDialog routerHost={ROUTER_IP} />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari MAC / Comment" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="id" label="id" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="chain" label="Chain" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="action" label="Action" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="src-mac-address" label="Source Mac" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="out-interface" label="Out Interface" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="disabled" label="Disable?" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="bytes" label="Bytes" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="comment" label="Comment" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Tidak ada rule ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((fwfilter) => (
                <TableRow key={fwfilter.id}>
                  <TableCell className="text-muted-foreground">{fwfilter.id}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.chain}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.action ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter["src-mac-address"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter["out-interface"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter["disabled"] === "true" ? "yes" : "no"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.bytes ? parseInt(fwfilter.bytes, 10) : "0"}</TableCell>
                  <TableCell className={cn("text-muted-foreground", { "text-destructive": fwfilter["disabled"] === "true" })}>{fwfilter["comment"] ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <FwFilterActionsMenu hostdata={fwfilter} basepath={BASE_PATH} />
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
