"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { useNetmgmtWsMessage } from "@/lib/netmgmt-ws-context";
import { cn } from "@/lib/utils";

/**
 * TIDAK render tabel-nya sendiri (data tetap dari Server Component, lihat
 * page.tsx) -- komponen ini CUMA dengarkan broadcast WebSocket section=
 * 'mailq' (dikirim netmgmt/tasks.py::check_mailq lewat Celery Beat, tiap
 * ~1 menit, lihat CELERY_BEAT_SCHEDULE di config/settings.py) & panggil
 * `router.refresh()` -- Next.js re-fetch data Server Component (termasuk
 * pagination/sort/filter yg SEDANG aktif di URL) dari server, TANPA reload
 * penuh & TANPA perlu duplikasi logic pagination/sort/filter di client JS
 * (logic itu SUDAH ada server-side, lihat netmgmt/list_utils.py -- dipakai
 * ULANG lewat refresh, bukan diimplementasikan lagi di sini).
 */
export function MailQueueLiveRefresher() {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { status } = useNetmgmtWsMessage((msg) => {
    if (msg.section === "mailq") {
      setLastUpdate(new Date());
      router.refresh();
    }
  });

  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 5000); // re-render tiap 5 detik supaya teks "X detik lalu" ikut jalan
    return () => clearInterval(interval);
  }, []);

  const secondsAgo = lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / 1000) : null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Radio className={cn("h-3.5 w-3.5", status === "connected" ? "text-success" : "text-muted-foreground")} />
      {status === "connected" ? (
        <span>Live{secondsAgo !== null && ` — diperbarui ${secondsAgo}d lalu`}</span>
      ) : status === "connecting" ? (
        <span>Menghubungkan...</span>
      ) : (
        <span>Terputus, mencoba lagi...</span>
      )}
    </div>
  );
}
