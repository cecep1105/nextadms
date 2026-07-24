"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
const STORAGE_KEY = "ccpadms_mobile_auth";

interface MobileAuthState {
  accessToken: string;
  refreshToken: string;
  pin: string | null;
  displayName: string;
  mustChangePassword: boolean;
}

interface MobileAuthContextValue {
  auth: MobileAuthState | null;
  /** null selagi baru baca localStorage (hindari kedip redirect ke /mobile/login sebelum sempat tahu ada sesi tersimpan). */
  ready: boolean;
  login: (pin: string, mobilePassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  /** Fetch ke API mattendance dgn Bearer token mobile -- auto-refresh SEKALI kalau dapat 401, ulang requestnya. */
  request: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
}

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

export class MobileApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<MobileAuthState | null>(null);
  const [ready, setReady] = useState(false);
  const authRef = useRef<MobileAuthState | null>(null);
  authRef.current = auth;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAuth(JSON.parse(raw));
    } catch {
      // localStorage tidak bisa dibaca (mode privat ketat dst) -- anggap belum login.
    }
    setReady(true);
  }, []);

  function persist(next: MobileAuthState | null) {
    setAuth(next);
    authRef.current = next;
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }

  const login = useCallback(async (pin: string, mobilePassword: string) => {
    const res = await fetch(`${API_BASE_URL}/mattendance/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, mobile_password: mobilePassword }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { success: false, message: body?.message ?? "PIN atau password salah." };
    }
    const data = await res.json();
    persist({
      accessToken: data.access,
      refreshToken: data.refresh,
      pin: data.pin,
      displayName: data.display_name,
      mustChangePassword: data.must_change_password,
    });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  async function tryRefresh(): Promise<string | null> {
    const current = authRef.current;
    if (!current?.refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: current.refreshToken }),
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      const next: MobileAuthState = {
        ...current,
        accessToken: data.access,
        refreshToken: data.refresh ?? current.refreshToken, // ROTATE_REFRESH_TOKENS=True di Django -- refresh token lama otomatis di-blacklist, WAJIB simpan yg baru
      };
      persist(next);
      return next.accessToken;
    } catch {
      persist(null); // refresh token juga sudah invalid -- paksa logout, form login akan muncul lagi
      return null;
    }
  }

  const request = useCallback(async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const doFetch = (token: string | undefined) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

    let res = await doFetch(authRef.current?.accessToken);
    if (res.status === 401) {
      const newToken = await tryRefresh();
      if (newToken) res = await doFetch(newToken);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new MobileApiError(res.status, body);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }, []);

  return (
    <MobileAuthContext.Provider value={{ auth, ready, login, logout, request }}>
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth() {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) throw new Error("useMobileAuth harus dipakai di dalam <MobileAuthProvider>");
  return ctx;
}
