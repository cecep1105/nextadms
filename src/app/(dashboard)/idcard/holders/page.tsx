import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { IDCardHolder } from "@/types/api";
import { AddHolderButton } from "./_components/add-holder-button";
import { EditHolderButton } from "./_components/edit-holder-button";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

async function getHolders(page?: string, q?: string): Promise<{ count: number; page: number; results: IDCardHolder[] }> {
  const params = new URLSearchParams();
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  params.set("_limit", String(PAGE_SIZE));
  return apiServerFetch(`/idcard/holders/?${params.toString()}`);
}

export default async function IdCardHoldersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const data = await getHolders(searchParams.page, searchParams.q);

  return (
    <div>
      <PageHeader
        title="Data Visitor / BHL"
        description="Data pemegang kartu yang tidak punya PIN absensi -- diinput manual di sini, terpisah dari data karyawan."
        action={<AddHolderButton />}
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / no. identitas / perusahaan" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>No. Identitas</TableHead>
              <TableHead>Perusahaan/Keperluan</TableHead>
              <TableHead>Berlaku</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada data.</TableCell></TableRow>
            ) : (
              data.results.map((holder) => (
                <TableRow key={holder.id}>
                  <TableCell className="font-medium">{holder.full_name}</TableCell>
                  <TableCell><Badge variant="secondary">{holder.card_type === "visitor" ? "Visitor" : "BHL"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{holder.id_number || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {holder.card_type === "visitor" ? [holder.company, holder.purpose].filter(Boolean).join(" — ") || "-" : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {holder.valid_until ? `s.d. ${new Date(holder.valid_until).toLocaleDateString("id-ID")}` : "Tidak terbatas"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EditHolderButton holder={holder} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
