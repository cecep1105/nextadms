"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List, Search, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetmgmtWsMessage } from "@/lib/netmgmt-ws-context";
import type { MikrotikNetwatchItem } from "@/types/api";
import { NetwatchCard } from "./netwatch-card";
import { NetwatchActionsMenu } from "./netwatch-actions-menu";

type ViewMode = "card" | "list";

/**
 * Data netwatch di sini DIKELOLA PENUH DI CLIENT (BEDA dari halaman
 * Mikrotik lain -- DHCP/Firewall Filter yang pagination/sort/search-nya
 * SERVER-side lewat URL param) -- alasannya: broadcast WebSocket (lihat
 * netmgmt/routeros_netwatch_webhook_view.py, dipicu script RouterOS tiap
 * status up/down berubah) SELALU berisi DAFTAR LENGKAP semua netwatch
 * entry saat itu (bukan 1 halaman) -- coba rekonsiliasi itu dgn
 * pagination server-side jadi rumit tanpa banyak manfaat, krn jumlah
 * host netwatch biasanya TIDAK sebanyak itu (puluhan, bukan ribuan) --
 * jadi SEMUA data diambil sekaligus (tanpa pagination), search/sort
 * dikerjakan di client, & update WebSocket tinggal GANTI state lokal
 * langsung (tidak perlu request/refresh ke server sama sekali).
 */
export function NetwatchLiveView({
  initialData, basePath,
}: {
  initialData: MikrotikNetwatchItem[];
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = (searchParams.get("view") as ViewMode) || "card";

  const [items, setItems] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  // router.refresh() (dipanggil NetwatchActionsMenu setelah aksi
  // enable/disable/dst) bikin Server Component re-fetch & kirim
  // `initialData` BARU ke sini -- sinkronkan balik ke state lokal.
  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const { status } = useNetmgmtWsMessage((msg) => {
    if (msg.section === "netwatch") {
      const results = (msg.message as { results?: MikrotikNetwatchItem[] }).results;
      if (Array.isArray(results)) setItems(results);
    }
  });

  function setViewMode(mode: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`${pathname}?${params.toString()}`);
  }

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? items.filter((item) => item.host.toLowerCase().includes(q) || (item.comment ?? "").toLowerCase().includes(q))
      : items;
    // Host 'down' SELALU di atas (permintaan eksplisit -- langsung
    // terlihat tanpa perlu cari/scroll) -- di antara sesama status yang
    // sama, urutan asli (dari router) dipertahankan (stable sort).
    return [...filtered].sort((a, b) => Number(b.status === "down") - Number(a.status === "down"));
  }, [items, searchQuery]);

  const downCount = items.filter((i) => i.status === "down").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari host / comment" className="pl-8 text-xs" />
          </div>
          {downCount > 0 && <Badge variant="destructive">{downCount} host down</Badge>}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className={cn("h-3.5 w-3.5", status === "connected" ? "text-success" : "text-muted-foreground")} />
            {status === "connected" ? "Live" : status === "connecting" ? "Menghubungkan..." : "Terputus"}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button variant={viewMode === "card" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("card")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Card
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-3.5 w-3.5" /> List
          </Button>
        </div>
      </div>

      {viewMode === "card" ? (
        visibleItems.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">Tidak ada host netwatch ditemukan.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <NetwatchCard key={item.id} item={item} basePath={basePath} />
            ))}
          </div>
        )
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Since</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Disabled?</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada host netwatch ditemukan.</TableCell></TableRow>
              ) : (
                visibleItems.map((item) => (
                  <TableRow key={item.id} className={cn(item.status === "down" && "bg-destructive/5")}>
                    <TableCell className="font-mono">{item.host}</TableCell>
                    <TableCell>
                      {item.status === "down" ? <Badge variant="destructive">Down</Badge>
                        : item.status === "up" ? <Badge variant="success">Up</Badge>
                        : <Badge variant="warning">{item.status}</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.since ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.interval ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.disabled === "true" ? "yes" : "no"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.comment ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <NetwatchActionsMenu hostdata={item} basepath={basePath} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
