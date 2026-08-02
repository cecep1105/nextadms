import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, ITInfraEntrySummary } from "@/types/api";
import { ViewItInfraDetailButton } from "./_components/view-itinfra-detail-button";

// TIDAK ada filter tab kategori & TIDAK ada tombol Tambah (SENGAJA,
// beda dari halaman staff) -- endpoint kategori TETAP staff-only,
// cari berdasarkan kategori tetap bisa lewat search bar biasa. Entry
// yang ditandai is_staff_only OTOMATIS TIDAK MUNCUL di sini SAMA
// SEKALI (disaring di backend) -- bukan cuma disembunyikan di tampilan.
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

async function getEntries(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<ITInfraEntrySummary>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<ITInfraEntrySummary>>(`/netmgmt/itinfra/entries/?${params.toString()}`);
}

export default async function PortalItInfraPage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getEntries(searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="Data IT-Infra"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / catatan / kategori" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="category_name" label="Kategori" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="updated_at" label="Diperbarui" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell><Badge variant="secondary">{entry.category_name}</Badge></TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={entry.notes}>{entry.notes || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(entry.updated_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ViewItInfraDetailButton entryId={entry.id} entryName={entry.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
