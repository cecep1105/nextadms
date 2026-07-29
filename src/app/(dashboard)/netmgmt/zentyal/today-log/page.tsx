import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { MailTodayLogEntry } from "@/types/api";

export default async function ZentyalTodayLogPage() {
  const data = await apiServerFetch<{ result: MailTodayLogEntry[] }>("/netmgmt/zentyal-mail/today-log/");

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal / Today's Log" description={`Ringkasan email masuk/keluar hari ini (${data.result.length} entri).`} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Queue ID</TableHead>
              <TableHead>Pengirim</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Jml Penerima</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.result.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada log hari ini.</TableCell></TableRow>
            ) : (
              data.result.map((entry, i) => (
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
      </Card>
    </div>
  );
}
