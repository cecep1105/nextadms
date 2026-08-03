"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useApiClient } from "@/lib/api-client";
import type { EmployeeSearchResult } from "@/types/api";

/**
 * Autocomplete PIN utk KAITKAN user ke data Employee (form Kelola User)
 * -- BEDA dari PinAutocomplete di halaman Attendance Recap (yang
 * NAVIGASI ke kartu rekap saat diklik) -- di sini klik hasil cuma
 * MEMILIH PIN itu ke dalam form (tidak pindah halaman), reuse endpoint
 * pencarian yang SAMA (/iclock/employee-search/,
 * staff yang buka halaman ini otomatis lolos permission-nya).
 */
export function EmpPinAutocomplete({ value, onChange }: { value: string; onChange: (pin: string, name?: string) => void }) {
  const { request } = useApiClient();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<EmployeeSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (query.trim().length < 2 || query === value) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      request<{ employees: EmployeeSearchResult[] }>(`/iclock/employee-search/?q=${encodeURIComponent(query)}`)
        .then((data) => { setResults(data.employees); setOpen(true); })
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(emp: EmployeeSearchResult) {
    setQuery(emp.pin);
    onChange(emp.pin, emp.name);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    onChange("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ketik PIN atau nama..."
          className="pl-8 pr-8"
        />
        {query && (
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Hapus">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          {results.map((emp) => (
            <button
              key={emp.pin}
              type="button"
              onClick={() => handleSelect(emp)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-secondary"
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
