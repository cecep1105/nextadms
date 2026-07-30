"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Router } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApiClient } from "@/lib/api-client";

interface RouterChoice {
  dept_name: string;
  ip_router: string;
}

/**
 * Dropdown pilih router -- opsi dari `iclock.RegisteredDevice.IPRouter`
 * (lihat netmgmt/router_choices_view.py), label "<nama dept> - <IP>".
 * Pilihan ditulis ke URL param `?router=<ip>` (mengganti halaman yang
 * sedang dilihat, Server Component page.tsx yang baca param ini &
 * query ulang ke router yang dipilih) -- SAMA pola dgn komponen
 * RouterOS* lain (baca/tulis URL, bukan state lokal).
 */
export function RouterSelector({ currentRouterIp }: { currentRouterIp: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { request } = useApiClient();
  const [choices, setChoices] = useState<RouterChoice[]>([]);

  useEffect(() => {
    let cancelled = false;
    request<{ results: RouterChoice[] }>("/netmgmt/router-choices/")
      .then((data) => { if (!cancelled) setChoices(data.results); })
      .catch(() => { /* gagal ambil daftar pilihan -- dropdown cukup kosong, tidak ganggu halaman utama */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(ip: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("router", ip);
    params.delete("page"); // ganti router -> mulai dari halaman 1 lagi
    router.push(`${pathname}?${params.toString()}`);
  }

  // Kalau router SAAT INI (dari default/.env) belum ada di daftar pilihan
  // (mis. IP belum terdaftar sbg IPRouter device mana pun), tetap
  // tampilkan sbg opsi TAMBAHAN supaya dropdown tidak "kosong"/membingungkan.
  const hasCurrent = choices.some((c) => c.ip_router === currentRouterIp);

  return (
    <Select value={currentRouterIp} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <Router className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Pilih router" />
      </SelectTrigger>
      <SelectContent>
        {!hasCurrent && <SelectItem value={currentRouterIp}>{currentRouterIp} (saat ini)</SelectItem>}
        {choices.map((c) => (
          <SelectItem key={c.ip_router} value={c.ip_router}>{c.dept_name} - {c.ip_router}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
