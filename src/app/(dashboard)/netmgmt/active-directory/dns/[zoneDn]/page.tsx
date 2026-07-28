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
import type { Paginated, DnsRecordRow } from "@/types/api";
import { AddRecordButton } from "./_components/add-record-button";
import { RecordActionsMenu } from "./_components/record-actions-menu";

const PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ zoneDn: string }>;
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

/** Ringkas isi `data` (beda field per tipe) jadi 1 baris teks manusiawi. */
function formatRecordValue(record: DnsRecordRow): string {
  const d = record.data;
  switch (record.type) {
    case "A":
    case "AAAA":
      return d.address ?? "-";
    case "CNAME":
    case "NS":
    case "PTR":
      return d.target ?? "-";
    case "MX":
      return `${d.preference ?? "?"} ${d.exchange ?? "-"}`;
    case "SRV":
      return `${d.priority ?? "?"} ${d.weight ?? "?"} ${d.port ?? "?"} ${d.target ?? "-"}`;
    case "TXT":
      return d.text ?? "-";
    default:
      return "(format tidak dikenal -- read-only)";
  }
}

async function getRecords(zoneDn: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<DnsRecordRow>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  params.set("_search_fields", "name,type");
  return apiServerFetch<Paginated<DnsRecordRow>>(`/netmgmt/ad/dns/zones/${encodeURIComponent(zoneDn)}/records/?${params.toString()}`);
}

export default async function ActiveDirectoryDnsRecordsPage({ params, searchParams }: PageProps) {
  const { zoneDn: zoneDnEncoded } = await params;
  const zoneDn = decodeURIComponent(zoneDnEncoded);
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getRecords(zoneDn, sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Active Directory / DNS Records"
        description={
          <div className="flex flex-col gap-1">
            <Link href="/netmgmt/active-directory/dns" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ArrowLeft className="h-3 w-3" /> Kembali ke Daftar Zone
            </Link>
            <span className="font-mono text-[11px] text-muted-foreground">{zoneDn}</span>
          </div>
        }
        action={<AddRecordButton zoneDn={zoneDn} />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / tipe" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="type" label="Tipe" /></TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="ttl_seconds" label="TTL" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada record ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((record) => (
                <TableRow key={record.raw_b64}>
                  <TableCell className="font-mono">{record.name}</TableCell>
                  <TableCell><Badge variant="secondary">{record.type}</Badge></TableCell>
                  <TableCell className="font-mono text-muted-foreground">{formatRecordValue(record)}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{record.ttl_seconds}</TableCell>
                  <TableCell>
                    <RecordActionsMenu zoneDn={zoneDn} record={record} />
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
