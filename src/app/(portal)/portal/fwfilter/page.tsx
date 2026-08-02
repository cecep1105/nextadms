import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterSelector } from "@/components/netmgmt/router-selector";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MikrotikFirewallFilterRule } from "@/types/api";
import { PortalGrantAccessDialog } from "./_components/portal-grant-access-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

async function getFwFilter(router?: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MikrotikFirewallFilterRule> & { router_ip: string }> {
  const params = new URLSearchParams();
  // ⚠️ KOREKSI: SEBELUMNYA baris ini salah tulis `params.set("router_ip",
  // "src-mac-address,comment")` -- itu sisa eksperimen yang KELIRU
  // (isinya malah daftar search field, BUKAN IP router), akibatnya
  // pilihan dropdown RouterSelector TIDAK PERNAH sungguh dikirim ke
  // backend (searchParams.router bahkan tidak dibaca sama sekali) --
  // dropdown-nya TAMPIL tapi TIDAK ADA EFEKNYA. Sekarang param `router`
  // diteruskan dgn BENAR ke ?router= (dibaca netmgmt/portal_views.py::
  // _resolve_router_ip sbg prioritas TERTINGGI, di atas default
  // NetmgmtRouterDefault/env fallback).
  if (router) params.set("router", router);
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MikrotikFirewallFilterRule> & { router_ip: string }>(`/netmgmt/portal/fwfilter/?${params.toString()}`);
}

export default async function PortalFwFilterPage({
  searchParams,
}: {
  searchParams: { router?: string; sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getFwFilter(searchParams.router, searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="Firewall Filter"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
        action={<PortalGrantAccessDialog routerHost={data.router_ip} />}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari MAC / Comment" />
          <RouterSelector currentRouterIp={data.router_ip} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="chain" label="Chain" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="action" label="Action" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="src-mac-address" label="Source Mac" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="disabled" label="Disable?" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="comment" label="Comment" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada rule ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((fwfilter) => (
                <TableRow key={fwfilter.id}>
                  <TableCell className="text-muted-foreground">{fwfilter.chain}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter.action ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter["src-mac-address"] ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{fwfilter["disabled"] === "true" ? "yes" : "no"}</TableCell>
                  <TableCell className={cn("text-muted-foreground", { "text-destructive": fwfilter["disabled"] === "true" })}>{fwfilter["comment"] ?? "-"}</TableCell>
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
