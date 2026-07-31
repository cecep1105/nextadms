"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SourceOption {
  slug: string;
  title: string;
}

/**
 * Dropdown pilih submenu Mobile Attendance (Karyawan/Driver/Mitra/
 * Kantin/Kantin Mitra Mobile, lihat mclock/sources.py::
 * MOBILE_ATTENDANCE_SOURCES) -- SATU halaman menaungi SEMUA submenu
 * (sesuai permintaan), ganti submenu = ganti sumber data MSSQL yang
 * di-query (server/database BEDA per submenu, lihat backend).
 */
export function MobileAttendanceSourceSelector({ current, sources }: { current: string; sources: SourceOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", slug);
    params.delete("page"); // ganti submenu -> mulai dari halaman 1 lagi
    params.delete("q"); // pencarian submenu lama TIDAK relevan lagi utk submenu baru
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pilih submenu" />
      </SelectTrigger>
      <SelectContent>
        {sources.map((s) => (
          <SelectItem key={s.slug} value={s.slug}>{s.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
