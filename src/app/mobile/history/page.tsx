"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LogIn, LogOut, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMobileAuth } from "@/lib/mobile-auth-context";
import type { Paginated, AttendanceLog } from "@/types/api";

function CheckTypeIcon({ type }: { type: string }) {
  if (type === "IN") return <LogIn className="h-4 w-4 text-success" />;
  if (type === "MEAL") return <Utensils className="h-4 w-4 text-primary" />;
  return <LogOut className="h-4 w-4 text-warning" />;
}

export default function MobileHistoryPage() {
  const { request } = useMobileAuth();
  const [logs, setLogs] = useState<AttendanceLog[] | null>(null);

  useEffect(() => {
    request<Paginated<AttendanceLog>>("/mattendance/history/?page_size=30")
      .then((data) => setLogs(data.results))
      .catch(() => setLogs([]));
  }, [request]);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Link href="/mobile/checkin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-base font-semibold tracking-tight">Riwayat Absensi Saya</h1>
      </div>

      {logs === null ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Belum ada riwayat absensi.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <CheckTypeIcon type={log.check_type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{log.pool_name ?? log.pool_id ?? "-"}</p>
                <p className="font-tabular text-[11px] text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString("id-ID")}
                </p>
              </div>
              <Badge variant={log.check_type === "IN" ? "success" : log.check_type === "MEAL" ? "default" : "warning"}>
                {log.check_type_display}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
