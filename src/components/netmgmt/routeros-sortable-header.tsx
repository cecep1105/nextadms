"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * Header kolom bisa-diklik KHUSUS halaman Mikrotik/netmgmt -- BEDA dari
 * `components/shared/sortable-header.tsx` (dipakai tabel Django biasa,
 * Server Component, satu param gabungan `?ordering=field`/`-field`).
 *
 * Kenapa terpisah: data Mikrotik TIDAK datang dari database Django (lihat
 * penjelasan lengkap di netmgmt/routeros_api_view.py), jadi endpoint API-
 * nya pakai konvensi param BEDA -- 2 param terpisah `sortBy` (nama field)
 * + `sortDir` (asc/desc), bukan 1 param gabungan `-field`. Komponen ini
 * jadi CLIENT COMPONENT (bukan Server Component + <Link> spt versi
 * shared) krn togglenya lewat onClick + router.push langsung.
 *
 * SEBELUMNYA komponen ini terduplikasi PERSIS 3x (folder dhcp/fwfilter/
 * netwatch) -- sekarang cuma 1 lokasi, dipakai ulang oleh ketiganya.
 */
export function RouterOSSortableHeader({ columnKey, label }: { columnKey: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sortBy");
  const currentDir = searchParams.get("sortDir");
  const isActive = currentSort === columnKey;
  const isDesc = isActive && currentDir === "desc";

  function handleSort() {
    const params = new URLSearchParams(searchParams.toString());
    // Toggle 3-tahap: belum aktif -> asc -> desc -> asc lagi (BUKAN
    // "hilang urutan sama sekali" -- lebih predictable, konsisten dgn
    // pola SortableHeader versi Django/shared).
    if (isActive && currentDir === "asc") {
      params.set("sortDir", "desc");
    } else {
      params.set("sortBy", columnKey);
      params.set("sortDir", "asc");
    }
    params.delete("page"); // ganti urutan -> balik ke halaman 1
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <button type="button" onClick={handleSort} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      {isActive ? (
        isDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
