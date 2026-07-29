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
import type { Paginated, MailBlockedSenderRow } from "@/types/api";
import { AddBlockedSenderButton } from "./_components/add-blocked-sender-button";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getBlockedSenders(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MailBlockedSenderRow>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MailBlockedSenderRow>>(`/netmgmt/zentyal-mail/block-senders/?${params.toString()}`);
}

export default async function ZentyalBlockSendersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getBlockedSenders(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Zentyal / Blocked Senders"
        description="Daftar alamat email yang ditolak (REJECT) otomatis oleh Postfix."
        action={<AddBlockedSenderButton />}
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari email" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="email" label="Email" /></TableHead>
              <TableHead>Aksi Postfix</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="status" label="Status" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Belum ada sender yang diblokir.</TableCell></TableRow>
            ) : (
              data.results.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{row.email}</TableCell>
                  <TableCell className="text-muted-foreground">{row.action}</TableCell>
                  <TableCell>{row.status === "1" ? <Badge variant="destructive">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}</TableCell>
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
