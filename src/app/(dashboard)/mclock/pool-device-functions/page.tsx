import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, PoolDeviceFunction } from "@/types/api";
import { PoolDeviceFunctionFormDialog } from "./_components/pool-device-function-form-dialog";

const PAGE_SIZE = 20;
const BASE_PATH = "/mclock/pool-device-functions";

export default async function PoolDeviceFunctionsPage({
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

  const data = await apiServerFetch<Paginated<PoolDeviceFunction>>(`/mclock/pool-device-function/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Pool Device Function"
        description="Mapping PoolID -> KANTIN/Bukan KANTIN -- dikelola manual sepenuhnya, TIDAK disinkronkan dari MSSQL."
        action={<PoolDeviceFunctionFormDialog mode="create" />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari Pool ID..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="Pool ID" sortKey="PoolID" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Function Type" sortKey="function_type" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Dibuat" sortKey="created_at" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada mapping.</TableCell></TableRow>
            ) : (
              data.results.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.PoolID}</TableCell>
                  <TableCell>
                    {item.function_type === "KANTIN" ? (
                      <Badge variant="default">KANTIN</Badge>
                    ) : (
                      <Badge variant="secondary">Bukan KANTIN</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(item.created_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(item.updated_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <PoolDeviceFunctionFormDialog mode="edit" item={item} />
                      <DeleteConfirmButton endpoint={`/mclock/pool-device-function/${item.id}/`} label={`Mapping PoolID '${item.PoolID}'`} />
                    </div>
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
