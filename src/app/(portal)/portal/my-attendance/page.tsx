import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiServerFetch, ApiError } from "@/lib/api-server";
import type { AttendanceRecapCardResponse, AttendanceRecapCardRow } from "@/types/api";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Data absensi berubah setiap ada transaksi baru, WAJIB dynamic.
export const dynamic = "force-dynamic";

/** Kelompokkan baris transaksi flat jadi per-tanggal, URUT tanggal TERBARU dulu (sesuai contoh tampilan yang diminta). */
function groupByDate(rows: AttendanceRecapCardRow[]): { date: string; rows: AttendanceRecapCardRow[] }[] {
  const map = new Map<string, AttendanceRecapCardRow[]>();
  for (const row of rows) {
    const list = map.get(row.date) ?? [];
    list.push(row);
    map.set(row.date, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dateRows]) => ({ date, rows: dateRows }));
}

export default async function MyAttendancePage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const today = new Date();
  const year = Number(searchParams.year) || today.getFullYear();
  const month = Number(searchParams.month) || today.getMonth() + 1;

  let card: AttendanceRecapCardResponse | null = null;
  let notLinked = false;
  try {
    card = await apiServerFetch<AttendanceRecapCardResponse>(`/iclock/my-attendance/?year=${year}&month=${month}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notLinked = true;
    } else {
      throw err;
    }
  }

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const days = card ? groupByDate(card.rows) : [];

  return (
    <div>
      <PageHeader
        title="My Attendance"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />

      {notLinked ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Akun Anda belum terkait dengan data Employee (PIN absensi). Hubungi admin untuk mengaitkan akun Anda.
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {card!.name?.trim() || card!.pin} <span className="font-mono">({card!.pin})</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/portal/my-attendance?year=${prevMonth.year}&month=${prevMonth.month}`}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </Link>
              </Button>
              <span className="min-w-[9rem] text-center text-sm font-medium">{MONTH_NAMES[month - 1]} {year}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/portal/my-attendance?year=${nextMonth.year}&month=${nextMonth.month}`}>
                  Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {days.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Tidak ada transaksi absensi bulan ini.</Card>
          ) : (
            <div className="space-y-3">
              {days.map((day) => {
                const dateObj = new Date(day.date);
                return (
                  <Card key={day.date} className="overflow-hidden p-0">
                    <div className="flex items-baseline justify-between border-b border-border bg-secondary/50 px-4 py-2">
                      <span className="text-sm font-semibold">{dateObj.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                      <span className="font-tabular text-xs text-muted-foreground">{dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {day.rows.map((row, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                          <span className="font-mono text-muted-foreground">{row.device ?? "-"}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-tabular text-muted-foreground">{new Date(row.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                            {row.type === "IN" ? <Badge variant="success">IN</Badge> : <Badge variant="destructive">OUT</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
