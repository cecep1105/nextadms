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
import { NetmgmtWsProvider } from "@/lib/netmgmt-ws-context";
import type { MailQueueResponse, MailQueueItem } from "@/types/api";
import { QueueItemActions } from "./_components/queue-item-actions";
import { DeleteBySenderButton } from "./_components/delete-by-sender-button";
import { MailQueueLiveRefresher } from "./_components/mail-queue-live-refresher";

const PAGE_SIZE = 20;
// SAMA pola konvensi param dgn Mikrotik/AD/Zentyal LDAP (_page/_limit/
// _sort_by/_order/_q) -- lihat netmgmt/list_utils.py, sekarang JUGA
// diterapkan ke endpoint Zentyal Mail (netmgmt/zentyal_mail_view.py).

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getMailQueue(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<MailQueueResponse> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<MailQueueResponse>(`/netmgmt/zentyal-mail/queue/?${params.toString()}`);
}

export default async function ZentyalMailQueuePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getMailQueue(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);
  const activeCount = data.results.filter((m) => m.status === "active").length;
  const deferredCount = data.results.filter((m) => m.status === "deferred").length;

  return (
    <NetmgmtWsProvider>
      <div>
        <PageHeader
          title="NetMgmt / Zentyal / Mail Queue"
          description={`Total ${data.count} pesan di queue (${activeCount} active, ${deferredCount} deferred di halaman ini).`}
          action={<DeleteBySenderButton />}
        />
        <Card>
          <div className="flex items-center justify-between border-b border-border p-3">
            <RouterOSSearchBar placeholder="Cari Queue ID / sender / recipient" />
            <MailQueueLiveRefresher />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><RouterOSSortableHeader columnKey="id" label="Queue ID" /></TableHead>
                <TableHead><RouterOSSortableHeader columnKey="status" label="Status" /></TableHead>
                <TableHead><RouterOSSortableHeader columnKey="size" label="Ukuran" /></TableHead>
                <TableHead><RouterOSSortableHeader columnKey="rawdate" label="Tanggal" /></TableHead>
                <TableHead><RouterOSSortableHeader columnKey="sender" label="Pengirim" /></TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Alasan Ditunda</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Mail queue kosong.</TableCell></TableRow>
              ) : (
                data.results.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.id}</TableCell>
                    <TableCell>
                      {item.status === "active" ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Deferred</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.size}</TableCell>
                    <TableCell className="text-muted-foreground">{item.rawdate}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sender}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground" title={item.recipient}>{item.recipient}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground" title={item.reason}>{item.reason || "-"}</TableCell>
                    <TableCell><QueueItemActions qid={item.id} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(sp.page ?? "1")} />
        </Card>
      </div>
    </NetmgmtWsProvider>
  );
}
