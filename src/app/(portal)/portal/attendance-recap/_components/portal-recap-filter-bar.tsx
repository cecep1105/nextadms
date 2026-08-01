"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApiClient } from "@/lib/api-client";
import type { PoolDeviceChoicesResponse } from "@/types/api";

// Lihat catatan lengkap di recap-filter-bar.tsx (versi staff) -- Radix
// Select tidak mengizinkan value="", sentinel ini jadi opsi "Semua X"
// yang bisa diklik utk reset filter.
const ALL_VALUE = "__all__";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Versi portal dari RecapFilterBar (dashboard staff) -- PIN + Pool +
 * Device + rentang tanggal (TANPA Function Code, itu cuma relevan utk
 * "Rekap All" & di portal jenis rekap SUDAH ditentukan lewat tab, lihat
 * PortalRecapTypeTabs). Pool/Device diambil dari endpoint RINGAN &
 * READ-ONLY (/iclock/pool-device-choices/, lihat
 * iclock/api_views.py::PoolDeviceChoicesAPIView) -- BUKAN endpoint
 * Department/ActiveDevice biasa yang staff-only & expose detail
 * device selengkapnya (IP/MAC/dst), tidak cocok utk user portal.
 */
export function PortalRecapFilterBar({ recapType }: { recapType: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { request } = useApiClient();

  const [pin, setPin] = useState(searchParams.get("pin") ?? "");
  const [pool, setPool] = useState(searchParams.get("pool") ?? "");
  const [device, setDevice] = useState(searchParams.get("device") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? daysAgoIso(6));
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? todayIso());

  const [pools, setPools] = useState<{ id: number; name: string }[]>([]);
  const [devices, setDevices] = useState<{ sn: string; name: string }[]>([]);

  useEffect(() => {
    request<PoolDeviceChoicesResponse>("/iclock/pool-device-choices/")
      .then((data) => setPools(data.pools))
      .catch(() => { /* gagal ambil daftar pool -- dropdown cukup kosong, tidak ganggu filter lain */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pool) { setDevices([]); return; }
    request<PoolDeviceChoicesResponse>(`/iclock/pool-device-choices/?pool_id=${pool}`)
      .then((data) => setDevices(data.devices ?? []))
      .catch(() => setDevices([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("recap_type", recapType);
    if (pin) params.set("pin", pin);
    if (pool) params.set("pool", pool);
    if (device) params.set("device", device);
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5 lg:col-span-2">
        <Label>PIN / Nama</Label>
        <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Kosongkan utk semua" />
      </div>
      <div className="space-y-1.5">
        <Label>Pool</Label>
        <Select value={pool || ALL_VALUE} onValueChange={(v) => { setPool(v === ALL_VALUE ? "" : v); setDevice(""); }}>
          <SelectTrigger><SelectValue placeholder="Semua Pool" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Semua Pool</SelectItem>
            {pools.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Device</Label>
        <Select value={device || ALL_VALUE} onValueChange={(v) => setDevice(v === ALL_VALUE ? "" : v)} disabled={!pool}>
          <SelectTrigger><SelectValue placeholder={pool ? "Semua Device" : "Pilih Pool dulu"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Semua Device</SelectItem>
            {devices.map((d) => (
              <SelectItem key={d.sn} value={d.sn}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Dari</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Sampai</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>
      <div className="flex items-end lg:col-span-5">
        <Button type="submit" size="sm">
          <Search className="h-3.5 w-3.5" /> Terapkan Filter
        </Button>
      </div>
    </form>
  );
}
