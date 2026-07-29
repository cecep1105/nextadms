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
import type { Paginated, MailAuthFailLogEntry } from "@/types/api";
import { TimeFilterLinks } from "@/components/netmgmt/time-filter-links";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ time?: string; sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getSaslLogs(time: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MailAuthFailLogEntry>> {
  const params = new URLSearchParams({ time });
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MailAuthFailLogEntry>>(`/netmgmt/zentyal-mail/sasl-logs/?${params.toString()}`);
}

export default async function ZentyalSaslLogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const time = sp.time ?? "minute";
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getSaslLogs(time, sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal / SASL Logs" description="Percobaan autentikasi SASL (SMTP) yang GAGAL, dikelompokkan per IP -- indikasi kemungkinan brute-force." />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <TimeFilterLinks basePath="/netmgmt/zentyal/sasl-logs" current={time} />
          <RouterOSSearchBar placeholder="Cari IP" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="date" label="Waktu" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="ip" label="IP" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="count" label="Jumlah Percobaan" /></TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada percobaan gagal pada rentang waktu ini.</TableCell></TableRow>
            ) : (
              data.results.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                  <TableCell className="font-mono">{entry.ip}</TableCell>
                  <TableCell>{(entry.count ?? 1) > 3 ? <Badge variant="destructive">{entry.count}x</Badge> : <Badge variant="secondary">{entry.count}x</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.notes}</TableCell>
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
