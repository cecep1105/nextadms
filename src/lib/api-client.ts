"use client";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

// Default PATH RELATIF ("/api/v1", TANPA scheme/host) -- browser otomatis
// resolve ini terhadap origin App INI SENDIRI SAAT ITU, apa pun IP/domain
// yang dipakai user utk buka halamannya (nginx menyatukan Next.js & API
// Django jadi 1 origin yang sama, lihat docker/nginx/nginx.conf) --
// TIDAK PERLU tahu/set IP spesifik & TIDAK PERLU rebuild kalau ganti cara
// akses (beda dari sebelumnya, yang WAJIB di-bake absolut saat build).
//
// `NEXT_PUBLIC_API_BASE_URL` TETAP bisa di-set eksplisit sbg override
// kalau memang butuh API di origin BERBEDA (mis. Next.js & Django
// sungguhan dipisah domain, bukan disatukan nginx spt setup default ini).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Request GAGAL TOTAL sebelum sempat dapat respons HTTP apa pun -- CORS
 * ditolak browser, server API tidak terjangkau/mati, DNS gagal, dst.
 * SENGAJA dipisah dari `ApiError` (yang berarti server MERESPONS, cuma
 * responsnya error) -- keduanya butuh pesan & langkah diagnosis yang
 * BEDA TOTAL buat developer/admin yang baca.
 */
export class NetworkError extends Error {
  url: string;
  constructor(url: string, cause: unknown) {
    super(
      `Tidak bisa terhubung ke API di '${url}'. Kemungkinan penyebab: (1) server Django/nginx belum ` +
      `jalan atau path proxy nginx salah (cek docker/nginx/nginx.conf), (2) kalau ` +
      `NEXT_PUBLIC_API_BASE_URL di-override manual ke origin BERBEDA, origin frontend ini mungkin ` +
      `TIDAK ada di CORS_ALLOWED_ORIGINS Django -- cek tab Network/Console browser utk pesan spesifik.`
    );
    this.url = url;
    this.cause = cause;
  }
}

/**
 * Hook utk fetch ke API Django dari CLIENT COMPONENT (form submit, dialog
 * aksi, dst) -- otomatis lampirkan Bearer access token dari sesi
 * NextAuth yang SEDANG aktif di browser (`useSession`).
 */
export function useApiClient() {
  const { data: session } = useSession();

  const request = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

      let res: Response;
      try {
        res = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
            ...options.headers,
          },
        });
      } catch (cause) {
        // fetch() sendiri yang gagal (BUKAN respons HTTP error) -- INI
        // beda dari `!res.ok` di bawah. Paling sering: CORS ditolak
        // browser, atau server API memang tidak terjangkau.
        throw new NetworkError(url, cause);
      }

      if (!res.ok) {
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          /* bukan JSON */
        }
        throw new ApiError(res.status, body);
      }

      if (res.status === 204) return undefined as T;
      return res.json();
    },
    [session?.accessToken]
  );

  return { request, session };
}
