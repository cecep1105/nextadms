"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PageSizeSelect } from "@/components/shared/page-size-select";

/**
 * Pagination KHUSUS halaman Mikrotik/netmgmt -- CLIENT COMPONENT (beda
 * dari `components/shared/pagination-bar.tsx`, itu Server Component +
 * <Link>) krn data & pagination-nya TIDAK datang dari Django/database
 * (lihat penjelasan lengkap di netmgmt/routeros_api_view.py) -- navigasi
 * halaman lewat `router.push()` langsung.
 *
 * SEBELUMNYA komponen ini terduplikasi 3x (folder dhcp/fwfilter/
 * netwatch) -- sekarang cuma 1 lokasi. Sekalian dibersihkan: versi lama
 * punya fungsi `hrefFor()` yang DIDEFINISIKAN tapi TIDAK PERNAH DIPAKAI
 * (dead code, tombol Prev/Next asli pakai onClick+router.push, bukan
 * <Link href={hrefFor(...)}>) -- dihapus di sini.
 *
 * `PageSizeSelect` di-reuse LANGSUNG dari shared/ (bukan disalin lagi) --
 * bentuknya sudah cocok apa adanya (terima `pageSize`/`basePath`/
 * `searchParams`, tidak spesifik ke pola Django).
 */
export function RouterOSPaginationBar({
  count, pageSize, currentPage,
}: {
  count: number;
  pageSize: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, count);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span>
          Menampilkan <span className="font-medium text-foreground">{from}</span>–
          <span className="font-medium text-foreground">{to}</span> dari{" "}
          <span className="font-medium text-foreground">{count}</span> data
        </span>
        <PageSizeSelect pageSize={pageSize} basePath={pathname} searchParams={Object.fromEntries(searchParams.entries())} />
      </div>

      <div className="flex items-center gap-1.5">
        {/* Native <button disabled> (BUKAN Link) -- disabled BENERAN
            mencegah klik, beda dari kasus yg pernah kita perbaiki di
            components/shared/pagination-bar.tsx (di situ <a>/Link yang
            "disabled"-nya cuma visual, tidak berlaku di tag <a>). Di sini
            AMAN krn dari awal memang <button> asli, bukan Link. */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="rounded-md border border-border px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="px-2 font-tabular">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage}
          className="rounded-md border border-border px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
