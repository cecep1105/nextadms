import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { MailAuthFailLogEntry } from "@/types/api";
import { TimeFilterLinks } from "@/components/netmgmt/time-filter-links";

interface PageProps {
  searchParams: Promise<{ time?: string }>;
}

export default async function ZentyalImapLogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const time = sp.time ?? "minute";
  const data = await apiServerFetch<{ result: MailAuthFailLogEntry[] }>(`/netmgmt/zentyal-mail/imap-logs/?time=${time}`);

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal / IMAP Logs" description="Percobaan login IMAP yang GAGAL (kecuali dari localhost)." />
      <Card>
        <div className="border-b border-border p-3">
          <TimeFilterLinks basePath="/netmgmt/zentyal/imap-logs" current={time} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.result.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada percobaan gagal pada rentang waktu ini.</TableCell></TableRow>
            ) : (
              data.result.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                  <TableCell className="font-mono">{entry.email || "-"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{entry.ip}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
