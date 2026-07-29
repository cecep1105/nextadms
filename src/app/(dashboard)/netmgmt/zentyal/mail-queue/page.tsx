import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { MailQueueResponse } from "@/types/api";
import { QueueItemActions } from "./_components/queue-item-actions";
import { DeleteBySenderButton } from "./_components/delete-by-sender-button";

// PENTING: Flask API (test/zentyalmail_v2.py) kembalikan SEMUA isi queue
// SEKALIGUS (tidak ada pagination server-side) -- BEDA dari Mikrotik/AD/
// Zentyal LDAP yang pakai konvensi _page/_limit. Halaman ini TIDAK pakai
// RouterOSPaginationBar krn itu.

export default async function ZentyalMailQueuePage() {
  const data = await apiServerFetch<MailQueueResponse>("/netmgmt/zentyal-mail/queue/");
  const activeCount = data.result.filter((m) => m.status === "active").length;
  const deferredCount = data.result.filter((m) => m.status === "deferred").length;

  return (
    <div>
      <PageHeader
        title="NetMgmt / Zentyal / Mail Queue"
        description={`Total ${data.result.length} pesan di queue (${activeCount} active, ${deferredCount} deferred).`}
        action={<DeleteBySenderButton />}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Queue ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pengirim</TableHead>
              <TableHead>Penerima</TableHead>
              <TableHead>Alasan Ditunda</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.result.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Mail queue kosong.</TableCell></TableRow>
            ) : (
              data.result.map((item) => (
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
      </Card>
    </div>
  );
}
