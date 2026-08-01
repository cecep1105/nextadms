"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

/**
 * Tombol "Export XLSX" -- dipakai BARENG oleh halaman Rekap Absensi
 * staff DAN portal (props identik, cuma path API-nya beda). File .xlsx
 * (format RAPI, lihat iclock/xlsx_export.py) SEMUA baris yg cocok
 * filter yg SEDANG AKTIF (bukan cuma halaman yg sedang tampil), diambil
 * langsung dari `useSearchParams()` -- apa pun yg SUDAH di-"Terapkan
 * Filter" di URL, itu yg dikirim ke endpoint export.
 *
 * PAKAI fetch() MANUAL (BUKAN useApiClient().request(), yg cuma bisa
 * JSON) -- response di sini BINARY (file .xlsx), ditangani sbg Blob,
 * lalu dipicu jadi download browser via <a> sementara + URL.createObjectURL.
 */
export function ExportXlsxButton({ apiPath }: { apiPath: string }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}${apiPath}?${searchParams.toString()}`;
      const res = await fetch(url, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
      });
      if (!res.ok) {
        let message = `Gagal export (status ${res.status}).`;
        try {
          const body = await res.json();
          message = body.error || body.detail || message;
        } catch {
          /* respons error bukan JSON -- pesan default di atas dipakai */
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "rekap-absensi.xlsx";

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal export ke XLSX.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleExport} disabled={loading}
        className="border-success/40 text-success hover:bg-success/10 hover:text-success">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} Export XLSX
      </Button>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
