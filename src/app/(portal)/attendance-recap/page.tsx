import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { AttendanceRecapResponse } from "@/types/api";
import { PortalRecapFilterBar } from "./_components/portal-recap-filter-bar";

const PAGE_SIZE = 20;
const BASE_PATH = "/portal/attendance-recap";

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function PortalAttendanceRecapPage({
  searchParams,
}: {
  searchParams: { pin?: string; date_from?: string; date_to?: string; page?: string };
}) {
  const queried = Boolean(searchParams.date_from && searchParams.date_to);
  let recap: AttendanceRecapResponse | null = null;

  if (queried) {
    const query = new URLSearchParams({
      date_from: searchParams.date_from!,
      date_to: searchParams.date_to!,
      page: searchParams.page ?? "1",
      page_size: String(PAGE_SIZE),
    });
    if (searchParams.pin) query.set("pin", searchParams.pin);
    recap = await apiServerFetch<AttendanceRecapResponse>(`/iclock/attendance-recap/?${query.toString()}`);
  }

  return (
    <div>
      <PageHeader
        title="Rekap Absensi"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />

      <PortalRecapFilterBar />

      <div className="mt-4">
        {!queried ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Pilih rentang tanggal &amp; klik &quot;Terapkan Filter&quot; untuk menampilkan rekap.
          </Card>
        ) : recap!.results.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada data absensi untuk filter ini.
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-muted/50">Employee</TableHead>
                  {recap!.date_columns.map((col) => (
                    <TableHead key={col.date} className="text-center">
                      <div>{col.day_name}</div>
                      <div className="font-tabular text-[10px] font-normal">{new Date(col.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recap!.results.map((row) => (
                  <TableRow key={row.pin}>
                    <TableCell className="sticky left-0 z-10 bg-card">
                      <p className="font-medium">{row.name?.trim() || "-"}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{row.pin}</p>
                    </TableCell>
                    {row.cells.map((cell) => (
                      <TableCell key={cell.date} className="text-center font-tabular text-[11px]">
                        {cell.in_count === 0 && cell.out_count === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <div>
                            <div className="text-success">
                              {formatTime(cell.in_first)}{cell.in_count > 1 && <span className="text-muted-foreground"> ({cell.in_count})</span>}
                            </div>
                            <div className="text-destructive">
                              {formatTime(cell.out_last)}{cell.out_count > 1 && <span className="text-muted-foreground"> ({cell.out_count})</span>}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              count={recap!.count}
              pageSize={PAGE_SIZE}
              currentPage={recap!.page}
              basePath={BASE_PATH}
              searchParams={{ pin: searchParams.pin, date_from: searchParams.date_from, date_to: searchParams.date_to }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
