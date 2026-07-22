import { ApiError } from "@/lib/api-client";

/**
 * Ekstrak pesan error yang bisa ditampilkan dari body error API Django --
 * bentuknya BEDA-BEDA tergantung sumbernya:
 * 1. `{"code": "...", "message": "..."}` -- dari `service_error_response()`
 *    (api/views.py), dipakai SEMUA aksi user management (reset-password,
 *    toggle-active, set-staff, delete, dst). INI YANG PALING SERING
 *    KETEMU tapi SEBELUMNYA tidak ditangani benar (pesan ke-gabung dgn
 *    kode error internal, mis. "permission_denied Aksi ini hanya...").
 * 2. `{"detail": "..."}` -- dari APIView/PermissionDenied bawaan DRF.
 * 3. `{"field": ["pesan", ...]}` -- dari ValidationError serializer biasa.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError) || !err.body) return fallback;
  const body = err.body as Record<string, unknown>;

  if (typeof body.message === "string") return body.message; // bentuk (1), CEK PALING DULU
  if (typeof body.detail === "string") return body.detail; // bentuk (2)

  const messages = Object.entries(body) // bentuk (3)
    .filter(([key]) => key !== "code") // buang 'code' kalau nyasar ke sini
    .map(([, v]) => v)
    .flat()
    .filter((v): v is string => typeof v === "string");
  return messages.length > 0 ? messages.join(" ") : fallback;
}
