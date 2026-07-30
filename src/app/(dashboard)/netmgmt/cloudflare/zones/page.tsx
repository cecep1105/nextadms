import Link from "next/link";
import { Globe } from "lucide-react";
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
import type { Paginated, CloudflareZone } from "@/types/api";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getZones(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<CloudflareZone>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<CloudflareZone>>(`/netmgmt/cloudflare/zones/?${params.toString()}`);
}

export default async function CloudflareZonesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getZones(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Cloudflare / Domains" description={`Domain (zone) yang bisa diakses token API ini (${data.count} domain).`} />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama domain" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Domain" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="status" label="Status" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada domain ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-mono font-medium">{zone.name}</TableCell>
                  <TableCell>
                    {zone.paused ? <Badge variant="warning">Paused</Badge>
                      : zone.status === "active" ? <Badge variant="success">Active</Badge>
                      : <Badge variant="secondary">{zone.status}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Link
                        href={`/netmgmt/cloudflare/zones/${zone.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" /> Lihat Record
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(sp.page ?? "1")} />
      </Card>
    </div>
  );
}
