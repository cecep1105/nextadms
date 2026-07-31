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
import type { Paginated, MobileAttendanceSource, MobileAttendanceRow } from "@/types/api";
import { MobileAttendanceSourceSelector } from "./_components/mobile-attendance-source-selector";

// Data berasal LANGSUNG dari MSSQL eksternal (server-side, search/sort/
// pagination semuanya di query SQL, BUKAN Django ORM/database utama) --
// WAJIB dynamic (tidak boleh di-cache statis, datanya terus berubah).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ source?: string; sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getSources(): Promise<MobileAttendanceSource[]> {
  const data = await apiServerFetch<{ results: MobileAttendanceSource[] }>("/mclock/mobile-attendance/sources/");
  return data.results;
}

async function getTableData(slug: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MobileAttendanceRow>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<MobileAttendanceRow>>(`/mclock/mobile-attendance/${slug}/?${params.toString()}`);
}

export default async function MobileAttendancePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);

  const sources = await getSources();
  const currentSlug = sp.source && sources.some((s) => s.slug === sp.source) ? sp.source : sources[0]?.slug;

  const data = currentSlug
    ? await getTableData(currentSlug, sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size)
    : { count: 0, page: 1, results: [], next: null, previous: null };

  const currentTitle = sources.find((s) => s.slug === currentSlug)?.title ?? "";

  return (
    <div>
      <PageHeader
        title="Mobile Attendance"
        description={currentTitle ? `Data mentah "${currentTitle}" dari MSSQL -- read-only, belum diproses (bProses=0).` : "Belum ada submenu tersedia."}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari NIK" />
          {currentSlug && <MobileAttendanceSourceSelector current={currentSlug} sources={sources} />}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="Id" label="ID" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="sn" label="SN/Pool ID" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="nik" label="NIK" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="ttime" label="Waktu" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="ctype" label="Tipe" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="bProses" label="Status" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell className="font-mono text-muted-foreground">{row.Id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{row.sn}</TableCell>
                  <TableCell className="font-mono">{row.nik}</TableCell>
                  <TableCell className="text-muted-foreground">{row.ttime}</TableCell>
                  <TableCell className="text-muted-foreground">{row.ctype}</TableCell>
                  <TableCell>
                    <Badge variant={row.bProses ? "success" : "warning"}>{row.bProses ? "Sudah Diproses" : "Belum Diproses"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(sp.page ?? "1")} />
      </Card>
    </div>
  );
}
