import { Loader2 } from "lucide-react";

/**
 * Indikator loading GENERIK -- dipakai lewat konvensi bawaan Next.js
 * App Router (`loading.tsx` di tiap route group, lihat
 * src/app/(dashboard)/loading.tsx dkk) -- Next.js OTOMATIS bungkus
 * children dgn <Suspense fallback={...}> tiap kali navigasi ke halaman
 * BARU dlm segment itu, TIDAK perlu ubah/tambah apa pun di masing2
 * page.tsx yang SUDAH ADA (puluhan halaman) satu per satu.
 *
 * Sidebar/Topbar (bagian dari layout.tsx, DI LUAR slot {children}) TETAP
 * tampil normal SELAMA loading -- cuma area konten yang diganti spinner
 * ini, BUKAN full-screen overlay -- UX lebih halus (navigasi terasa
 * cepat/responsif meski data halaman baru masih diambil).
 */
export function PageLoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">Memuat...</p>
    </div>
  );
}
