import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MailTodayLogEntry } from "@/types/api";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getTodayLog(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MailTodayLogEntry>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MailTodayLogEntry>>(`/netmgmt/zentyal-mail/today-log/?${params.toString()}`);
}

export default async function ZentyalTodayLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getTodayLog(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal / Today's Log" description={`Ringkasan email masuk/keluar hari ini (${data.count} entri).`} />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari sender / Queue ID" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="date" label="Waktu" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="qid" label="Queue ID" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="sender" label="Pengirim" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="size" label="Ukuran" /></TableHead>
              <TableHead>Jml Penerima</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada log hari ini.</TableCell></TableRow>
            ) : (
              data.results.map((entry, i) => (
                <TableRow key={`${entry.qid}-${i}`}>
                  <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                  <TableCell className="font-mono">{entry.qid}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.sender}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.size}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.total_recp}</TableCell>
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
