import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MobilePool } from "@/types/api";
import { MobilePoolFormDialog } from "./_components/mobile-pool-form-dialog";

const PAGE_SIZE = 20;
const BASE_PATH = "/mclock/mobile-pools";

export default async function MobilePoolsPage({
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

  const data = await apiServerFetch<Paginated<MobilePool>>(`/mclock/mobile-pool/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Mobile Pool"
        description="Data pool/lokasi absensi mobile, disinkronkan dari MSSQL eksternal."
        action={<MobilePoolFormDialog mode="create" />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari Pool ID / Code / Nama..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="Pool ID" sortKey="PoolID" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Pool Code" sortKey="PoolCode" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Nama" sortKey="PoolName" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Koordinat</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead><SortableHeader label="Synced" sortKey="SyncedAt" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((pool) => (
                <TableRow key={pool.PoolID}>
                  <TableCell className="font-mono">{pool.PoolID}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{pool.PoolCode ?? "-"}</TableCell>
                  <TableCell className="font-medium">{pool.PoolName ?? "-"}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {pool.Latitude && pool.Longitude ? `${pool.Latitude}, ${pool.Longitude}` : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{pool.Radius ? `${pool.Radius}m` : "-"}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">
                    {pool.SyncedAt ? new Date(pool.SyncedAt).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <MobilePoolFormDialog mode="edit" pool={pool} />
                      <DeleteConfirmButton endpoint={`/mclock/mobile-pool/${pool.PoolID}/`} label={`Pool '${pool.PoolName || pool.PoolID}'`} />
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
