import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { MailBlockedSenderRow } from "@/types/api";
import { AddBlockedSenderButton } from "./_components/add-blocked-sender-button";

export default async function ZentyalBlockSendersPage() {
  const data = await apiServerFetch<{ result: MailBlockedSenderRow[] }>("/netmgmt/zentyal-mail/block-senders/");

  return (
    <div>
      <PageHeader
        title="NetMgmt / Zentyal / Blocked Senders"
        description="Daftar alamat email yang ditolak (REJECT) otomatis oleh Postfix."
        action={<AddBlockedSenderButton />}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Aksi Postfix</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.result.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Belum ada sender yang diblokir.</TableCell></TableRow>
            ) : (
              data.result.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{row.email}</TableCell>
                  <TableCell className="text-muted-foreground">{row.action}</TableCell>
                  <TableCell>{row.status === "1" ? <Badge variant="destructive">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
