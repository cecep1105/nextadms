"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { useSession } from "next-auth/react";

/**
 * SAMA PERSIS strukturnya dgn lib/iclock-ws-context.tsx (lihat komentar
 * lengkap di sana soal kenapa URL WebSocket dihitung dinamis dari
 * window.location, bukan path relatif) -- BEDA cuma endpoint (/ws/netmgmt,
 * BUKAN /ws/iclock) & GROUP-nya di sisi Django (lihat netmgmt/consumers.py
 * ::GROUP_NETMGMT, netmgmt/tasks.py::check_mailq yg broadcast section='mailq').
 *
 * DIPISAH dari IclockWsProvider (bukan reuse 1 koneksi) SUPAYA: (1) client
 * yang cuma buka halaman netmgmt (mis. Mail Queue) TIDAK ikut ke-subscribe
 * ke traffic iClock yang jauh lebih ramai (banyak device fisik), & (2)
 * sebaliknya -- 2 use-case ini punya volume/kebutuhan berbeda, tidak perlu
 * dipaksa share 1 koneksi.
 */
function getWsBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (override) return override;
  if (typeof window === "undefined") return "";
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}`;
}

export interface NetmgmtWsMessage {
  section: string;
  message: Record<string, unknown>;
}

export type WsConnectionStatus = "connecting" | "connected" | "disconnected";

type Listener = (msg: NetmgmtWsMessage) => void;

interface NetmgmtWsContextValue {
  status: WsConnectionStatus;
  subscribe: (listener: Listener) => () => void;
}

const NetmgmtWsContext = createContext<NetmgmtWsContextValue | null>(null);

export function NetmgmtWsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<WsConnectionStatus>("connecting");
  const listenersRef = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByEffectCleanup = false;

    function connect() {
      setStatus("connecting");
      ws = new WebSocket(`${getWsBaseUrl()}/ws/netmgmt?token=${token}`);

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NetmgmtWsMessage;
          listenersRef.current.forEach((listener) => listener(data));
        } catch {
          // pesan bukan JSON valid -- abaikan, jangan crash listener
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        if (!closedByEffectCleanup) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        // onclose TETAP terpanggil setelah onerror -- reconnect cukup di onclose.
      };
    }

    connect();

    return () => {
      closedByEffectCleanup = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [session?.accessToken]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <NetmgmtWsContext.Provider value={{ status, subscribe }}>
      {children}
    </NetmgmtWsContext.Provider>
  );
}

export function useNetmgmtWs() {
  const ctx = useContext(NetmgmtWsContext);
  if (!ctx) {
    throw new Error("useNetmgmtWs harus dipakai di dalam <NetmgmtWsProvider>");
  }
  return ctx;
}

/** Convenience hook -- subscribe 1 callback ke pesan WS, auto unsubscribe saat unmount. */
export function useNetmgmtWsMessage(onMessage: Listener) {
  const { status, subscribe } = useNetmgmtWs();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    return subscribe((msg) => onMessageRef.current(msg));
  }, [subscribe]);

  return { status };
}
