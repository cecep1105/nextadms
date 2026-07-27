import "server-only";
import { auth } from "@/lib/auth";

// PENTING: server-side fetch (Server Component, jalan DI DALAM container
// `nextjs`) TIDAK lewat nginx/IP publik sama sekali -- bisa langsung ke
// container Django lewat jaringan internal Docker Compose (nama service
// `django-web`), lebih cepat & TIDAK PERLU tahu IP/domain publik apa pun.
// SENGAJA BUKAN env var `NEXT_PUBLIC_*` (itu utk BROWSER, beda konteks
// -- lihat lib/api-client.ts) -- env var biasa spt ini dibaca saat
// RUNTIME oleh Next.js (bukan di-bake saat build), jadi ganti nilainya
// di docker-compose `environment:` TIDAK PERLU rebuild image sama sekali.
const DJANGO_INTERNAL_URL = process.env.DJANGO_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

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
 * Fetch ke API Django dari SERVER COMPONENT/Server Action -- otomatis
 * lampirkan Bearer access token dari sesi NextAuth. `revalidate: 0`
 * (default) supaya data SELALU fresh (dashboard admin, bukan konten
 * statis) -- override lewat `next` option kalau perlu caching di endpoint
 * tertentu.
 */
export async function apiServerFetch<T = unknown>(
  path: string,
  options: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {}
): Promise<T> {
  const session = await auth();
  const url = path.startsWith("http") ? path : `${DJANGO_INTERNAL_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* respons bukan JSON (mis. 502 dari proxy) -- biarkan body null */
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
