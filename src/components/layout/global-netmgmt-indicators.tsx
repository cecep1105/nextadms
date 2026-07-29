"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, WifiOff, Lock } from "lucide-react";
import { useApiClient } from "@/lib/api-client";
import { useNetmgmtWsMessage } from "@/lib/netmgmt-ws-context";
import { cn } from "@/lib/utils";

/**
 * Indikator GLOBAL (tampil di Topbar, semua halaman dashboard staff --
 * BEDA dari badge serupa di halaman Mail Queue/Netwatch sendiri, yang
 * cuma tampil saat halaman ITU lagi dibuka) -- sejajar tombol dark/light
 * theme, sesuai permintaan.
 *
 * Alur data: (1) fetch NILAI AWAL sekali saat komponen ini mount
 * (SEBELUM broadcast WebSocket pertama masuk, supaya angka tidak kosong
 * nunggu event pertama -- mail queue di-check tiap 1 menit via Celery
 * Beat, netwatch cuma saat status BERUBAH, bisa lama kalau kebetulan
 * semua host stabil), (2) SETELAHNYA murni ikut broadcast WebSocket
 * (section 'mailq'/'netwatch', lihat netmgmt/tasks.py &
 * netmgmt/routeros_netwatch_webhook_view.py) -- TIDAK polling ulang.
 */
export function GlobalNetmgmtIndicators() {
  const { request } = useApiClient();
  const [activeQueueCount, setActiveQueueCount] = useState<number | null>(null);
  const [downHostCount, setDownHostCount] = useState<number | null>(null);
  const [lockedUserCount, setLockedUserCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    request<{ active_count: number }>("/netmgmt/zentyal-mail/queue/?_limit=1")
      .then((data) => { if (!cancelled) setActiveQueueCount(data.active_count); })
      .catch(() => { /* server mail mungkin belum dikonfigurasi -- biarkan badge tersembunyi, jangan tampilkan error di topbar */ });
    request<{ down_count: number }>("/netmgmt/netwatch-summary/")
      .then((data) => { if (!cancelled) setDownHostCount(data.down_count); })
      .catch(() => { /* router netwatch mungkin belum dikonfigurasi -- sama, diamkan saja */ });
    request<{ count: number }>("/netmgmt/ad/users/locked/?_limit=1")
      .then((data) => { if (!cancelled) setLockedUserCount(data.count); })
      .catch(() => { /* AD mungkin belum dikonfigurasi -- sama, diamkan saja */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useNetmgmtWsMessage((msg) => {
    if (msg.section === "mailq") {
      const active = (msg.message as { active_count?: number }).active_count;
      if (typeof active === "number") setActiveQueueCount(active);
    }
    if (msg.section === "netwatch") {
      const results = (msg.message as { results?: { status: string }[] }).results;
      if (Array.isArray(results)) setDownHostCount(results.filter((r) => r.status === "down").length);
    }
    if (msg.section === "ad_locked_users") {
      const count = (msg.message as { count?: number }).count;
      if (typeof count === "number") setLockedUserCount(count);
    }
  });

  return (
    <div className="flex items-center gap-1">
      {activeQueueCount !== null && (
        <Link
          href="/netmgmt/zentyal/mail-queue"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={`${activeQueueCount} mail queue active`}
        >
          <Mail className="h-4 w-4" />
          {activeQueueCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-tabular text-[10px] font-semibold text-primary-foreground">
              {activeQueueCount > 99 ? "99+" : activeQueueCount}
            </span>
          )}
        </Link>
      )}

      {downHostCount !== null && (
        <Link
          href="/netmgmt/mikrotik/netwatch"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={`${downHostCount} host netwatch down`}
        >
          <WifiOff className={cn("h-4 w-4", downHostCount > 0 && "text-destructive")} />
          {downHostCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-tabular text-[10px] font-semibold text-destructive-foreground">
              {downHostCount > 99 ? "99+" : downHostCount}
            </span>
          )}
        </Link>
      )}

      {lockedUserCount !== null && (
        <Link
          href="/netmgmt/active-directory/locked-users"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={`${lockedUserCount} user AD terkunci (2 menit terakhir)`}
        >
          <Lock className={cn("h-4 w-4", lockedUserCount > 0 && "text-destructive")} />
          {lockedUserCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-tabular text-[10px] font-semibold text-destructive-foreground">
              {lockedUserCount > 99 ? "99+" : lockedUserCount}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
