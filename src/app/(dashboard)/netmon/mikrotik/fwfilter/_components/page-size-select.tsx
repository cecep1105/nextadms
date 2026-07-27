"use client";
import { useRouter } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PageSizeSelect({
  pageSize, basePath, searchParams,
}: {
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  
}) {
  const router = useRouter();

  function handleChange(value: string) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page_size", value);
    params.set("page", "1"); // ganti ukuran halaman -> baris yg SAMA bisa jatuh di halaman beda, balik ke 1 supaya tidak bingung
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap">Baris/halaman:</span>
      <Select value={String(pageSize)} onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-[4.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}