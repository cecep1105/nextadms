"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { useSession } from "next-auth/react";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:8000";

export interface IclockWsMessage {
  section: string;
  message: Record<string, unknown>;
}

export type WsConnectionStatus = "connecting" | "connected" | "disconnected";

type Listener = (msg: IclockWsMessage) => void;

interface IclockWsContextValue {
  status: WsConnectionStatus;
  /** Daftar sbg listener pesan baru -- return function utk unsubscribe (panggil di cleanup useEffect pemanggil). */
  subscribe: (listener: Listener) => () => void;
}

const IclockWsContext = createContext<IclockWsContextValue | null>(null);

/**
 * SATU koneksi WebSocket (/ws/iclock) dipakai BERSAMA oleh beberapa
 * komponen (LiveDeviceTable utk update kolom tabel, WsConsolePanel utk
 * log mentah) -- SEBELUMNYA tiap komponen buka koneksinya SENDIRI2 kalau
 * pakai hook biasa, boros (2x resource server & 2x proses auth per
 * browser tab, padahal isinya SAMA PERSIS). Provider ini yang pegang
 * lifecycle koneksinya, komponen anak tinggal `subscribe()` ke pesan yang
 * lewat.
 */
export function IclockWsProvider({ children }: { children: React.ReactNode }) {
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
      ws = new WebSocket(`${WS_BASE_URL}/ws/iclock?token=${token}`);

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as IclockWsMessage;
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
    <IclockWsContext.Provider value={{ status, subscribe }}>
      {children}
    </IclockWsContext.Provider>
  );
}

export function useIclockWs() {
  const ctx = useContext(IclockWsContext);
  if (!ctx) {
    throw new Error("useIclockWs harus dipakai di dalam <IclockWsProvider>");
  }
  return ctx;
}

/** Convenience hook -- subscribe 1 callback ke pesan WS, auto unsubscribe saat unmount. */
export function useIclockWsMessage(onMessage: Listener) {
  const { status, subscribe } = useIclockWs();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    return subscribe((msg) => onMessageRef.current(msg));
  }, [subscribe]);

  return { status };
}
