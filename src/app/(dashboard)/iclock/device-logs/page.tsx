import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, DeviceLog } from "@/types/api";

const PAGE_SIZE = 20;

export default async function DeviceLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);

  const data = await apiServerFetch<Paginated<DeviceLog>>(`/iclock/device-log/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Device Log"
        description="Ringkasan data yang diupload device ke server (jumlah record & error per tipe data)."
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari SN device / tipe data..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu Upload</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Tipe Data</TableHead>
              <TableHead>Object</TableHead>
              <TableHead>Jumlah Record</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada device log.</TableCell></TableRow>
            ) : (
              data.results.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(log.OpTime).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-mono">{log.SN}</TableCell>
                  <TableCell className="font-medium">{log.OP}</TableCell>
                  <TableCell className="text-muted-foreground">{log.Object ?? "-"}</TableCell>
                  <TableCell className="font-tabular">{log.Cnt}</TableCell>
                  <TableCell>
                    {log.ECnt > 0 ? <Badge variant="destructive">{log.ECnt}</Badge> : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath="/iclock/device-logs" searchParams={{ q: search }} />
      </Card>
    </div>
  );
}
