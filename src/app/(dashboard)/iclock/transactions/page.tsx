import { Smartphone } from "lucide-react";
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
import type { Paginated, Transaction } from "@/types/api";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/transactions";

export default async function TransactionsPage({
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

  const data = await apiServerFetch<Paginated<Transaction>>(`/iclock/transaction/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Transaction"
        description="Riwayat absensi -- data mesin ini dibuat otomatis via PUSH SDK/mobile, tidak untuk diedit manual."
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari PIN / Nama employee..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="Waktu" sortKey="TTime" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Device / Sumber</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Verify</TableHead>
              <TableHead><SortableHeader label="Function" sortKey="Function" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada transaksi ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((trx) => (
                <TableRow key={trx.id}>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(trx.TTime).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <p className="font-medium">{trx.EmployeeName?.trim() || "-"}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{trx.EmployeePIN}</p>
                  </TableCell>
                  <TableCell>
                    {trx.SN === "ABSENDIGITAL01" ? (
                      <Badge variant="default"><Smartphone className="mr-1 h-2.5 w-2.5" /> Mobile</Badge>
                    ) : (
                      <span className="font-mono text-muted-foreground">{trx.SN ?? "-"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{trx.StateDisplay}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {trx.SN === "ABSENDIGITAL01" ? `Pool ${trx.Verify}` : trx.VerifyDisplay}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{trx.Function ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteConfirmButton
                        endpoint={`/iclock/transaction/${trx.id}/`}
                        label={`Transaksi ${trx.EmployeeName || trx.EmployeePIN} pada ${new Date(trx.TTime).toLocaleString("id-ID")}`}
                      />
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
