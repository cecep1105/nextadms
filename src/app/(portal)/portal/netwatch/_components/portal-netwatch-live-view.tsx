"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetmgmtWsMessage } from "@/lib/netmgmt-ws-context";
import type { MikrotikNetwatchItem } from "@/types/api";
import { PortalNetwatchCard } from "./portal-netwatch-card";

/**
 * Versi PORTAL dari NetwatchLiveView (staff) -- CUMA mode Card (TIDAK
 * ADA toggle List, TIDAK ADA tombol Tambah/aksi per-host -- sesuai
 * scope yang diminta: bentuk card saja, hanya readonly saja, tapi bisa
 * menerima event websocket. Mekanisme WebSocket & agregasi data SAMA
 * PERSIS dgn versi staff -- data diambil SEKALIGUS (tanpa pagination
 * server-side) saat halaman dibuka, update SETELAHNYA murni via
 * broadcast WebSocket (section='netwatch'), TIDAK ADA request ulang ke
 * server sama sekali.
 */
export function PortalNetwatchLiveView({ initialData }: { initialData: MikrotikNetwatchItem[] }) {
  const [items, setItems] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const { status } = useNetmgmtWsMessage((msg) => {
    if (msg.section === "netwatch") {
      const results = (msg.message as { results?: MikrotikNetwatchItem[] }).results;
      if (Array.isArray(results)) setItems(results);
    }
  });

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? items.filter((item) => item.host.toLowerCase().includes(q) || (item.comment ?? "").toLowerCase().includes(q))
      : items;
    // Host 'down' SELALU di atas -- langsung terlihat tanpa perlu cari/scroll.
    return [...filtered].sort((a, b) => Number(b.status === "down") - Number(a.status === "down"));
  }, [items, searchQuery]);

  const downCount = items.filter((i) => i.status === "down").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
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

      {visibleItems.length === 0 ? (
        <Card className="py-8 text-center text-sm text-muted-foreground">Tidak ada host netwatch ditemukan.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <PortalNetwatchCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
