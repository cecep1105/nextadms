import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationBar({
  count,
  pageSize,
  currentPage,
  basePath,
  searchParams,
}: {
  count: number;
  pageSize: number;
  currentPage: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, count);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Menampilkan <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> dari{" "}
        <span className="font-medium text-foreground">{count}</span> data
      </span>
      <div className="flex items-center gap-1.5">
        {/* PENTING: atribut HTML "disabled" TIDAK BERLAKU utk tag <a> --
            Button dgn asChild+Link SEBELUMNYA cuma TERLIHAT disabled
            (styling abu-abu) tapi TETAP BISA DIKLIK & navigasi ke
            ?page=N yang tidak ada datanya -> error dari API. Fix: kalau
            SEHARUSNYA disabled, render <button disabled> NATIVE (BUKAN
            Link sama sekali) -- itu satu-satunya cara "disabled" beneran
            mencegah interaksi, bukan cuma tampilan. */}
        {isFirstPage ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={hrefFor(currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
            </Link>
          </Button>
        )}
        <span className="px-2 font-tabular">
          {currentPage} / {totalPages}
        </span>
        {isLastPage ? (
          <Button variant="outline" size="sm" disabled>
            Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={hrefFor(currentPage + 1)}>
              Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
