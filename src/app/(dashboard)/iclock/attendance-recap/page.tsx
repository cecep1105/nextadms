import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import { auth } from "@/lib/auth";
import type { AttendanceRecapResponse, Paginated, Department, ActiveDevice } from "@/types/api";
import { RecapFilterBar } from "./_components/recap-filter-bar";
import { RecapTypeTabs } from "./_components/recap-type-tabs";

const PAGE_SIZE = 20;

const RECAP_TYPE_LABEL: Record<string, string> = { all: "All", kantin: "Kantin", driver: "Driver" };

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function AttendanceRecapPage({
  searchParams,
}: {
  searchParams: {
    recap_type?: string; pin?: string; function?: string; pool?: string; device?: string;
    date_from?: string; date_to?: string; page?: string; page_size?: string;
  };
}) {
  const session = await auth();
  const permissions = {
    can_view_attendance_recap: session?.user?.can_view_attendance_recap ?? false,
    can_view_attendance_recap_kantin: session?.user?.can_view_attendance_recap_kantin ?? false,
    can_view_attendance_recap_driver: session?.user?.can_view_attendance_recap_driver ?? false,
  };

  // Kalau recap_type di URL TIDAK diizinkan (atau tidak diisi), jatuh ke
  // jenis PERTAMA yang user PUNYA izinnya (urutan prioritas: All -> Kantin
  // -> Driver) -- BUKAN sekadar default 'all' begitu saja, krn user yang
  // CUMA diizinkan Kantin/Driver (tanpa 'all') harus tetap dapat tampilan
  // yang RELEVAN begitu buka halaman ini, bukan layar kosong/ditolak.
  const requestedType = searchParams.recap_type;
  const allowedTypes = (["all", "kantin", "driver"] as const).filter((t) => permissions[`can_view_attendance_recap${t === "all" ? "" : `_${t}`}` as keyof typeof permissions]);
  const recapType = requestedType && allowedTypes.includes(requestedType as "all" | "kantin" | "driver") ? requestedType : (allowedTypes[0] ?? "all");

  if (allowedTypes.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance Recap" description="Anda belum memiliki izin untuk melihat Rekap Absensi jenis apa pun." />
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Hubungi admin untuk meminta akses lewat halaman &quot;Kelola Izin User&quot;.
        </Card>
      </div>
    );
  }

  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const [departmentsData, devicesData] = await Promise.all([
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
    apiServerFetch<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"),
  ]);

  const queried = Boolean(searchParams.date_from && searchParams.date_to);
  let recap: AttendanceRecapResponse | null = null;

  if (queried) {
    const query = new URLSearchParams({
      recap_type: recapType,
      date_from: searchParams.date_from!,
      date_to: searchParams.date_to!,
      page: searchParams.page ?? "1",
      page_size: String(pageSize),
    });
    if (searchParams.pin) query.set("pin", searchParams.pin);
    if (searchParams.function && recapType === "all") query.set("function", searchParams.function);
    if (searchParams.pool) query.set("pool", searchParams.pool);
    if (searchParams.device) query.set("device", searchParams.device);
    recap = await apiServerFetch<AttendanceRecapResponse>(`/iclock/attendance-recap/?${query.toString()}`);
  }

  return (
    <div>
      <PageHeader
        title={`Attendance Recap - ${RECAP_TYPE_LABEL[recapType]}`}
        description="Matrix jam check-in pertama & check-out terakhir per hari, per employee. Klik hasil pencarian PIN untuk lihat kartu bulanan lengkap."
      />

      <RecapTypeTabs current={recapType} permissions={permissions} />
      <RecapFilterBar departments={departmentsData.results} devices={devicesData.results} recapType={recapType} />

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
                      <Link href={`/iclock/attendance-recap/${encodeURIComponent(row.pin)}`} className="block hover:text-primary">
                        <p className="font-medium">{row.name?.trim() || "-"}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{row.pin}</p>
                      </Link>
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
              pageSize={pageSize}
              currentPage={recap!.page}
              basePath="/iclock/attendance-recap"
              searchParams={{
                recap_type: recapType, pin: searchParams.pin, function: searchParams.function, pool: searchParams.pool,
                device: searchParams.device, date_from: searchParams.date_from, date_to: searchParams.date_to,
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
