import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * Header kolom tabel yang bisa diklik utk sorting -- toggle asc -> desc ->
 * asc tiap diklik, dipetakan ke param `?ordering=field` / `?ordering=-field`
 * (standar DRF OrderingFilter, lihat iclock/api_views.py::BaseIclockViewSet).
 * Server Component murni (bukan client) -- cuma hitung href Link, tidak
 * ada state/interaktivitas di luar navigasi biasa.
 */
export function SortableHeader({
  label, sortKey, currentSort, basePath, searchParams,
}: {
  label: string;
  /** Nama field DI API (persis sesuai nama field Django), mis. "DeptName", "TTime". */
  sortKey: string;
  /** Nilai `?ordering=` SAAT INI dari URL, mis. "" | "DeptName" | "-DeptName". */
  currentSort: string;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const isActive = currentSort === sortKey || currentSort === `-${sortKey}`;
  const isDesc = currentSort === `-${sortKey}`;
  // Klik pertama: ascending. Klik lagi (sudah aktif ascending): descending.
  // Klik lagi (sudah aktif descending): balik ke ascending (bukan "un-sort" --
  // lebih predictable drpd hilang urutan sama sekali).
  const nextSort = isActive && !isDesc ? `-${sortKey}` : sortKey;

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  params.set("ordering", nextSort);
  params.delete("page"); // reset ke halaman 1 tiap kali urutan berubah

  return (
    <Link href={`${basePath}?${params.toString()}`} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      {isActive ? (
        isDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </Link>
  );
}
