import { QrCode, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, AttendanceLog } from "@/types/api";

const PAGE_SIZE = 20;

function CheckTypeBadge({ type, display }: { type: string; display: string }) {
  if (type === "IN") return <Badge variant="success">{display}</Badge>;
  if (type === "MEAL") return <Badge variant="default"><QrCode className="mr-1 h-2.5 w-2.5" /> {display}</Badge>;
  return <Badge variant="secondary">{display}</Badge>;
}

export default async function AttendanceLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);

  const data = await apiServerFetch<Paginated<AttendanceLog>>(`/mattendance/admin/logs/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Log Absensi GPS"
        description="Riwayat check-in/out/meal via mobile app (geofence GPS + verifikasi wajah / QR pool)."
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari username..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Verifikasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Belum ada log absensi mobile.</TableCell></TableRow>
            ) : (
              data.results.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(log.timestamp).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell><CheckTypeBadge type={log.check_type} display={log.check_type_display} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.pool_name ?? "-"} {log.pool_id && <span className="font-mono text-[10px]">({log.pool_id})</span>}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{log.Function ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span className={log.location_verified ? "text-success" : "text-destructive"}>
                        📍 {log.location_verified ? "Lokasi valid" : "Lokasi tidak valid"}
                      </span>
                      {log.check_type === "MEAL" ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <QrCode className="h-3 w-3" /> Verifikasi via QR
                        </span>
                      ) : (
                        <span className={log.face_verified ? "text-success" : "text-destructive"}>
                          👤 {log.face_verified ? `Wajah cocok${log.face_distance !== null ? ` (${log.face_distance.toFixed(3)})` : ""}` : "Wajah tidak cocok"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteConfirmButton endpoint={`/mattendance/admin/logs/${log.id}/`} label={`Log absensi ${log.username} pada ${new Date(log.timestamp).toLocaleString("id-ID")}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath="/mattendance/logs" searchParams={{ q: search }} />
      </Card>
    </div>
  );
}
