"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Fingerprint, ArrowLeft, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { EmployeeSearchResult, PoolDeviceChoicesResponse } from "@/types/api";

export default function PortalTransferFingerPage() {
  const { request, session } = useApiClient();

  const [pinQuery, setPinQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);

  const [pools, setPools] = useState<PoolDeviceChoicesResponse["pools"]>([]);
  const [devices, setDevices] = useState<PoolDeviceChoicesResponse["devices"]>([]);
  const [toPool, setToPool] = useState("");
  const [targetDevice, setTargetDevice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[] | null>(null);

  // Muat daftar Pool sekali di awal (butuh accessToken siap dulu -- lihat
  // catatan race condition di lib/use-device-function-choices.ts).
  useEffect(() => {
    if (!session?.accessToken) return;
    request<PoolDeviceChoicesResponse>("/iclock/pool-device-choices/")
      .then((data) => setPools(data.pools))
      .catch(() => setPools([]));
  }, [session?.accessToken]);

  // Cari employee by PIN (debounce ringan).
  useEffect(() => {
    if (pinQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await request<{ employees: EmployeeSearchResult[] }>(`/iclock/employee-search/?q=${encodeURIComponent(pinQuery.trim())}`);
        setSearchResults(data.employees);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinQuery]);

  // Device tujuan menyesuaikan Pool yang dipilih.
  useEffect(() => {
    if (!toPool) {
      setDevices([]);
      return;
    }
    request<PoolDeviceChoicesResponse>(`/iclock/pool-device-choices/?pool_id=${toPool}`)
      .then((data) => setDevices(data.devices ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toPool]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee || !toPool) return;
    setLoading(true);
    setError(null);
    setLog(null);
    try {
      const result = await request<{ log: string[] }>(
        `/iclock/device-user/${selectedEmployee.id}/transfer-finger/`,
        { method: "POST", body: JSON.stringify({ to_pool: toPool, target_device: targetDevice || undefined }) }
      );
      setLog(result.log);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal transfer fingerprint."));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedEmployee(null);
    setPinQuery("");
    setSearchResults([]);
    setToPool("");
    setTargetDevice("");
    setLog(null);
    setError(null);
  }

  return (
    <div>
      <PageHeader
        title="Transfer Data Finger"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Kirim Fingerprint ke Pool/Device Tujuan</CardTitle>
        </CardHeader>
        <CardContent>
          {log ? (
            <div className="space-y-3">
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
                {log.map((line, i) => <div key={i}>{line}</div>)}
              </div>
              <Button onClick={resetForm}>Transfer Lagi</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

              <div className="space-y-1.5">
                <Label>Cari Employee (PIN / Nama)</Label>
                {selectedEmployee ? (
                  <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span className="font-mono">{selectedEmployee.pin}</span> — {selectedEmployee.name || "Tanpa nama"}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>Ganti</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={pinQuery} onChange={(e) => setPinQuery(e.target.value)} placeholder="Ketik PIN atau nama..." className="pl-8" />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
                        {searchResults.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => { setSelectedEmployee(emp); setSearchResults([]); }}
                            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
                          >
                            <span className="font-medium">{emp.name || "-"}</span>
                            <span className="font-mono text-muted-foreground">{emp.pin}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Pool Tujuan</Label>
                <Select value={toPool} onValueChange={(v) => { setToPool(v); setTargetDevice(""); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
                  <SelectContent>
                    {pools.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Device Spesifik (opsional)</Label>
                <Select value={targetDevice} onValueChange={setTargetDevice} disabled={!toPool}>
                  <SelectTrigger><SelectValue placeholder="Semua device di pool ini" /></SelectTrigger>
                  <SelectContent>
                    {(devices ?? []).map((d) => (
                      <SelectItem key={d.sn} value={d.sn}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading || !selectedEmployee || !toPool}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5" />} Transfer
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
