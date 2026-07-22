"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:8000";

export interface IclockWsMessage {
  section: "request" | "attlog" | string;
  message: Record<string, unknown>;
}

export type WsConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * Konek ke Django Channels (/ws/iclock) utk update real-time halaman
 * Active Device -- autentikasi via JWT lewat query string `?token=`
 * (lihat iclock/ws_auth.py di sisi Django; WebSocket API browser TIDAK
 * bisa kirim header Authorization biasa spt fetch()).
 *
 * Auto-reconnect dgn backoff sederhana kalau koneksi putus (mis. access
 * token expired di tengah sesi -- token BARU dari `session.accessToken`
 * otomatis dipakai di percobaan reconnect berikutnya, krn effect ini
 * re-run tiap `session.accessToken` berubah).
 */
export function useIclockWebSocket(onMessage: (msg: IclockWsMessage) => void) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<WsConnectionStatus>("connecting");
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

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
          onMessageRef.current(data);
        } catch {
          // pesan bukan JSON valid -- abaikan, jangan crash listener
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        // Reconnect otomatis SELAMA bukan cleanup effect (unmount/token
        // berubah) yang sengaja menutup koneksi ini -- hindari reconnect
        // loop yang percuma saat komponen sudah unmount.
        if (!closedByEffectCleanup) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        // onclose TETAP terpanggil setelah onerror (perilaku standar
        // WebSocket API) -- reconnect logic cukup di-handle di onclose,
        // tidak perlu duplikasi di sini.
      };
    }

    connect();

    return () => {
      closedByEffectCleanup = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [session?.accessToken]);

  return { status };
}
