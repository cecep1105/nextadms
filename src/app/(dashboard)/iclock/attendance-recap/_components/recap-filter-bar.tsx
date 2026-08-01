"use client";
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PinAutocomplete } from "./pin-autocomplete";
import { useDeviceFunctionChoices } from "@/lib/use-device-function-choices";
import type { Department, ActiveDevice } from "@/types/api";
import { cn } from "@/lib/utils";

// Radix Select TIDAK MENGIZINKAN SelectItem dgn value="" (dipakai internal
// utk representasi "belum ada pilihan"/placeholder) -- sentinel value INI
// dipakai sbg opsi "Semua X" yang BISA DIKLIK utk reset filter balik ke
// kosong (state React `pool`/`device`/`func` TETAP "" secara internal,
// cuma Select-nya butuh value NON-KOSONG buat direpresentasikan). Tanpa
// ini, setelah pilih 1 Pool, TIDAK ADA CARA balik ke "Semua Pool" lagi
// lewat dropdown (bug yg dilaporkan).
const ALL_VALUE = "__all__";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function RecapFilterBar({
  departments, devices, recapType,
}: {
  departments: Department[];
  devices: ActiveDevice[];
  recapType: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { choices: functionChoices } = useDeviceFunctionChoices();

  const [pin, setPin] = useState(searchParams.get("pin") ?? "");
  const [func, setFunc] = useState(searchParams.get("function") ?? "");
  const [pool, setPool] = useState(searchParams.get("pool") ?? "");
  const [device, setDevice] = useState(searchParams.get("device") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? daysAgoIso(6));
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? todayIso());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("recap_type", recapType);
    if (pin) params.set("pin", pin);
    if (func && recapType === "all") params.set("function", func); // Function code CUMA relevan/dikirim utk "Rekap All" -- utk Kantin/Driver, jenis fungsinya SUDAH ditentukan oleh tab yg dipilih
    if (pool) params.set("pool", pool);
    if (device) params.set("device", device);
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className={cn("space-y-1.5", recapType === "all" ? "lg:col-span-2" : "lg:col-span-3")}>
        <Label>PIN / Nama</Label>
        <PinAutocomplete value={pin} onChange={setPin} />
      </div>
      {recapType === "all" && (
        <div className="space-y-1.5">
          <Label>Function Code</Label>
          <Select value={func || ALL_VALUE} onValueChange={(v) => setFunc(v === ALL_VALUE ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Semua Function" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Semua Function</SelectItem>
              {functionChoices.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Pool</Label>
        <Select value={pool || ALL_VALUE} onValueChange={(v) => setPool(v === ALL_VALUE ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Semua Pool" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Semua Pool</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.DeptID} value={String(d.DeptID)}>{d.DeptName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Device</Label>
        <Select value={device || ALL_VALUE} onValueChange={(v) => setDevice(v === ALL_VALUE ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Semua Device" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Semua Device</SelectItem>
            {devices.map((d) => (
              <SelectItem key={d.SN} value={d.SN}>{d.Alias}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:col-span-1">
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
