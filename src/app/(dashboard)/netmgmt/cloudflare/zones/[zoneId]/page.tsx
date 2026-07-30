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
import type { Paginated, CloudflareDnsRecord } from "@/types/api";
import { AddCloudflareRecordButton } from "./_components/add-cloudflare-record-button";
import { CloudflareRecordActionsMenu } from "./_components/cloudflare-record-actions-menu";

const PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ zoneId: string }>;
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getRecords(zoneId: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<CloudflareDnsRecord>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<CloudflareDnsRecord>>(`/netmgmt/cloudflare/zones/${zoneId}/records/?${params.toString()}`);
}

export default async function CloudflareRecordsPage({ params, searchParams }: PageProps) {
  const { zoneId } = await params;
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getRecords(zoneId, sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Cloudflare / DNS Records"
        description={
          <Link href="/netmgmt/cloudflare/zones" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Daftar Domain
          </Link>
        }
        action={<AddCloudflareRecordButton zoneId={zoneId} />}
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / isi / tipe record" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="type" label="Tipe" /></TableHead>
              <TableHead>Isi</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="ttl" label="TTL" /></TableHead>
              <TableHead>Proxy</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada record ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">{record.name}</TableCell>
                  <TableCell><Badge variant="secondary">{record.type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-muted-foreground" title={record.content}>
                    {record.type === "MX" && record.priority != null ? `${record.priority} ${record.content}` : record.content}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{record.ttl === 1 ? "Auto" : record.ttl}</TableCell>
                  <TableCell>
                    {record.proxiable ? (
                      <Badge variant={record.proxied ? "success" : "secondary"}>{record.proxied ? "Proxied" : "DNS Only"}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell><CloudflareRecordActionsMenu zoneId={zoneId} record={record} /></TableCell>
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
