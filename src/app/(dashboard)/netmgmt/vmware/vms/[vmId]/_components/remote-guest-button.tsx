"use client";
import { useState } from "react";
import { Loader2, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Buka konsol VMware Remote Console (VMRC) -- perlu APLIKASI DESKTOP
 * VMRC terinstall di komputer user (mendaftarkan protocol handler
 * `vmrc://` ke OS) -- klik tombol ini navigasi browser ke URI itu, OS yg
 * urus buka aplikasi VMRC-nya (browser TIDAK bisa render VMRC sendiri).
 *
 * Panggil /api/vsphere-vmrc-ticket (Next.js API route, SUSUN URI
 * lengkap di server -- lihat route.ts) -- BUKAN lewat useApiClient
 * (itu utk Django, ini API Next.js sendiri, sama origin, tidak perlu
 * token/prefix /api/v1).
 */
export function RemoteGuestButton({ vmId }: { vmId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vsphere-vmrc-ticket?vm=${encodeURIComponent(vmId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil tiket VMRC.");
      }
      // Navigasi ke URI vmrc:// -- OS yg tangani (buka app VMRC kalau
      // terinstall, atau browser tampilkan dialog "buka dengan aplikasi
      // apa" kalau protocol handler belum terdaftar).
      window.location.href = data.uri;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuka Remote Console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorPlay className="h-3.5 w-3.5" />} Remote Guest
      </Button>
      {error && <p className="max-w-64 text-right text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
