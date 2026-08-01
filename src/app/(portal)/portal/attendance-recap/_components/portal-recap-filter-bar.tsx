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
import { useDeviceFunctionChoices } from "@/lib/use-device-function-choices";
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
 * Versi portal dari RecapFilterBar (dashboard staff) -- PIN + Function
 * (KHUSUS tab "All", lihat catatan di bawah) + Pool + Device + rentang
 * tanggal. Pool/Device & Function diambil dari endpoint RINGAN &
 * READ-ONLY (iclock/api_views.py::PoolDeviceChoicesAPIView/
 * DeviceFunctionChoicesAPIView, KEDUANYA diperluas izin aksesnya utk
 * non-staff dgn izin recap, BUKAN staff-only lagi) -- BUKAN endpoint
 * Department/ActiveDevice biasa yang staff-only & expose detail
 * device selengkapnya (IP/MAC/dst), tidak cocok utk user portal.
 */
export function PortalRecapFilterBar({
  recapType, permissions,
}: {
  recapType: string;
  permissions: { can_view_attendance_recap_kantin: boolean; can_view_attendance_recap_driver: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { request } = useApiClient();
  const { choices: functionChoices } = useDeviceFunctionChoices();

  // Kode Function KANTIN/DRIVER-* disembunyikan dari dropdown ini kalau
  // user TIDAK punya izin granular yang sesuai -- SAMA PERSIS logic dgn
  // versi staff (recap-filter-bar.tsx), lihat catatan lengkap di sana.
  const visibleFunctionChoices = functionChoices.filter((c) => {
    const desc = c.label.split(" — ")[1] ?? "";
    if (desc === "KANTIN") return permissions.can_view_attendance_recap_kantin;
    if (desc.startsWith("DRIVER")) return permissions.can_view_attendance_recap_driver;
    return true;
  });

  const [pin, setPin] = useState(searchParams.get("pin") ?? "");
  const [func, setFunc] = useState(searchParams.get("function") ?? "");
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
    if (func && recapType === "all") params.set("function", func); // Function CUMA relevan/dikirim utk "Rekap All" -- sama pola dgn versi staff
    if (pool) params.set("pool", pool);
    if (device) params.set("device", device);
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1.5 lg:col-span-2">
        <Label>PIN / Nama</Label>
        <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Kosongkan utk semua" />
      </div>
      {recapType === "all" && (
        <div className="space-y-1.5">
          <Label>Function Code</Label>
          <Select value={func || ALL_VALUE} onValueChange={(v) => setFunc(v === ALL_VALUE ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Semua Function" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Semua Function</SelectItem>
              {visibleFunctionChoices.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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
      <div className="flex items-end lg:col-span-6">
        <Button type="submit" size="sm">
          <Search className="h-3.5 w-3.5" /> Terapkan Filter
        </Button>
      </div>
    </form>
  );
}
