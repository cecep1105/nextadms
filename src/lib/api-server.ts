import "server-only";
import { auth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

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
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

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
