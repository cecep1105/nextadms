"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useApiClient } from "@/lib/api-client";
import type { EmployeeSearchResult } from "@/types/api";

/**
 * Autocomplete PIN/nama employee -- SEPERTI dashboard Django: kalau admin
 * KLIK salah satu hasil, langsung navigasi ke kartu rekap bulanan 1
 * employee itu (BUKAN sekadar mengisi filter PIN pada matrix utama).
 * Mengetik tanpa klik hasil (tekan Enter/klik tombol Filter) TETAP bisa
 * dipakai sbg filter regex biasa di matrix (lihat RecapFilterBar).
 */
export function PinAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [results, setResults] = useState<EmployeeSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await request<{ employees: EmployeeSearchResult[] }>(
          `/iclock/employee-search/?q=${encodeURIComponent(value.trim())}`
        );
        setResults(data.employees);
        setOpen(data.employees.length > 0);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ketik PIN / nama..."
          autoComplete="off"
          className="pl-8"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full min-w-[16rem] rounded-md border border-border bg-popover p-1 shadow-lg">
          {results.map((emp) => (
            <button
              key={emp.pin}
              type="button"
              onClick={() => router.push(`/iclock/attendance-recap/${encodeURIComponent(emp.pin)}`)}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
            >
              <span className="font-medium">{emp.name || "-"}</span>
              <span className="font-mono text-muted-foreground">{emp.pin}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
