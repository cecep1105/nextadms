import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch, ApiError } from "@/lib/api-server";
import type { AttendanceRecapCardResponse } from "@/types/api";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function AttendanceRecapEmployeeCardPage({
  params, searchParams,
}: {
  params: { pin: string };
  searchParams: { year?: string; month?: string };
}) {
  const pin = decodeURIComponent(params.pin);
  const today = new Date();
  const year = Number(searchParams.year) || today.getFullYear();
  const month = Number(searchParams.month) || today.getMonth() + 1;

  let card: AttendanceRecapCardResponse | null = null;
  let notFound = false;
  try {
    card = await apiServerFetch<AttendanceRecapCardResponse>(
      `/iclock/attendance-recap/${encodeURIComponent(pin)}/card/?year=${year}&month=${month}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound = true;
    } else {
      throw err;
    }
  }

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div>
      <PageHeader
        title={notFound ? `Employee '${pin}' tidak ditemukan` : `${card?.name?.trim() || pin}`}
        description={
          <Link href="/iclock/attendance-recap" className="text-primary hover:underline">
            ← Kembali ke Attendance Recap
          </Link>
        }
      />

      {notFound ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Employee dengan PIN <span className="font-mono">{pin}</span> tidak ditemukan.
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">PIN: {card!.pin}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/iclock/attendance-recap/${encodeURIComponent(pin)}?year=${prevMonth.year}&month=${prevMonth.month}`}>← Sebelumnya</Link>
              </Button>
              <span className="min-w-[9rem] text-center text-sm font-medium">{MONTH_NAMES[month - 1]} {year}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/iclock/attendance-recap/${encodeURIComponent(pin)}?year=${nextMonth.year}&month=${nextMonth.month}`}>Selanjutnya →</Link>
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {card!.rows.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada transaksi bulan ini.</TableCell></TableRow>
                ) : (
                  card!.rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-tabular">{new Date(row.date).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" })}</TableCell>
                      <TableCell className="font-tabular font-medium">{new Date(row.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</TableCell>
                      <TableCell>
                        {row.type === "IN" ? <Badge variant="success">Masuk</Badge> : <Badge variant="destructive">Keluar</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{row.device ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
