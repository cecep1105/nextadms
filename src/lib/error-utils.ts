import { ApiError, NetworkError } from "@/lib/api-client";

/**
 * Ekstrak pesan error yang bisa ditampilkan dari hasil panggilan API --
 * ADA 3 KEMUNGKINAN SUMBER, urutannya PENTING (dicek dari yang paling
 * spesifik):
 * 0. `NetworkError` -- fetch() gagal TOTAL (CORS ditolak / server tidak
 *    terjangkau), belum sempat dapat respons HTTP sama sekali. Pesannya
 *    SUDAH informatif dari sono (lihat api-client.ts), tampilkan APA
 *    ADANYA -- ini BUKAN kesalahan input user, jangan ganti jadi fallback
 *    generik yang menyesatkan (seolah aksinya "ditolak", padahal servernya
 *    tidak ke-reach).
 * 1. `{"code": "...", "message": "..."}` -- dari `service_error_response()`
 *    (api/views.py), dipakai SEMUA aksi user management.
 * 2. `{"detail": "..."}` -- dari APIView/PermissionDenied bawaan DRF.
 * 3. `{"field": ["pesan", ...]}` -- dari ValidationError serializer biasa.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return err.message;

  if (!(err instanceof ApiError) || !err.body) return fallback;
  const body = err.body as Record<string, unknown>;

  if (typeof body.message === "string") return body.message;
  if (typeof body.detail === "string") return body.detail;

  const messages = Object.entries(body)
    .filter(([key]) => key !== "code")
    .map(([, v]) => v)
    .flat()
    .filter((v): v is string => typeof v === "string");
  return messages.length > 0 ? messages.join(" ") : fallback;
}
