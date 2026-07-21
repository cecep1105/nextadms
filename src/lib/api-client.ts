"use client";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

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
 * Hook utk fetch ke API Django dari CLIENT COMPONENT (form submit, dialog
 * aksi, dst) -- otomatis lampirkan Bearer access token dari sesi
 * NextAuth yang SEDANG aktif di browser (`useSession`).
 */
export function useApiClient() {
  const { data: session } = useSession();

  const request = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          ...options.headers,
        },
      });

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
