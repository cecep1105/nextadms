"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "Rekap All", permKey: "can_view_attendance_recap" as const },
  { value: "kantin", label: "Rekap Kantin", permKey: "can_view_attendance_recap_kantin" as const },
  { value: "driver", label: "Rekap Driver", permKey: "can_view_attendance_recap_driver" as const },
];

/**
 * Tab pilih jenis Rekap Absensi (All/Kantin/Driver) -- CUMA tampilkan
 * tab yang user PUNYA izinnya (lihat iclock/api_views.py::
 * AttendanceRecapAPIView, HasAttendanceRecapPermission -- backend JUGA
 * menegakkan ini scr independen, tab yg disembunyikan di sini BUKAN
 * satu-satunya proteksi, cuma UX supaya user tidak lihat tab yg toh
 * akan ditolak backend).
 */
export function RecapTypeTabs({
  current, permissions,
}: {
  current: string;
  permissions: { can_view_attendance_recap: boolean; can_view_attendance_recap_kantin: boolean; can_view_attendance_recap_driver: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleTabs = TABS.filter((t) => permissions[t.permKey]);

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("recap_type", value);
    params.delete("page");
    params.delete("function"); // filter Function code CUMA relevan utk "Rekap All" -- ganti tab, hapus supaya tidak "nyangkut" dari tab sebelumnya
    router.push(`${pathname}?${params.toString()}`);
  }

  if (visibleTabs.length <= 1) return null; // cuma 1 (atau 0) jenis yg diizinkan -- tab selector tidak berguna, sembunyikan

  return (
    <div className="mb-4 flex gap-1 border-b border-border">
      {visibleTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => handleClick(tab.value)}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            current === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
