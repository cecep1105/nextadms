import { ApiError } from "@/lib/api-client";

/**
 * Ekstrak pesan error yang bisa ditampilkan dari body error API Django --
 * bentuknya bisa BEDA-BEDA tergantung endpoint: `{"detail": "..."}` (APIView
 * biasa) ATAU `{"field": ["pesan error", ...]}` (ValidationError DRF
 * serializer). Dipakai bersama di semua form dialog supaya konsisten &
 * type-safe (union dua bentuk ini bikin TypeScript bingung kalau di-inline
 * di tiap komponen).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError) || !err.body) return fallback;
  const body = err.body as Record<string, unknown>;
  if (typeof body.detail === "string") return body.detail;
  const messages = Object.values(body)
    .flat()
    .filter((v): v is string => typeof v === "string");
  return messages.length > 0 ? messages.join(" ") : fallback;
}
