import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, OperationLog } from "@/types/api";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/operation-logs";

export default async function OperationLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; ordering?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const ordering = searchParams.ordering ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);
  if (ordering) query.set("ordering", ordering);

  const data = await apiServerFetch<Paginated<OperationLog>>(`/iclock/operation-log/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Operation Log"
        description="Log aksi admin di device fisik (power on/off, alarm, ubah config, dst) -- dikirim device via OPERLOG tag 'OPLOG'."
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari SN device..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="Waktu" sortKey="OPTime" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Operasi</TableHead>
              <TableHead><SortableHeader label="Admin" sortKey="admin" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Object</TableHead>
              <TableHead>Param 1/2/3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada log operasi.</TableCell></TableRow>
            ) : (
              data.results.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(log.OPTime).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-mono">{log.SN ?? "-"}</TableCell>
                  <TableCell className="font-medium">{log.OpName}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{log.admin}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{log.Object ?? "-"}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {log.Param1 ?? "-"} / {log.Param2 ?? "-"} / {log.Param3 ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath={BASE_PATH} searchParams={{ q: search, ordering }} />
      </Card>
    </div>
  );
}
