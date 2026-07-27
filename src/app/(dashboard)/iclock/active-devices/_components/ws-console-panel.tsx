"use client";
import { useEffect, useRef, useState } from "react";
import { Terminal, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIclockWsMessage, type IclockWsMessage } from "@/lib/iclock-ws-context";

interface LogLine {
  id: number;
  time: string;
  section: string;
  text: string;
}

const MAX_LINES = 500;

function StatusBadge({ status }: { status: "connecting" | "connected" | "disconnected" }) {
  if (status === "connected") return <Badge variant="success">Terhubung</Badge>;
  if (status === "connecting") return <Badge variant="warning">Menghubungkan...</Badge>;
  return <Badge variant="destructive">Terputus</Badge>;
}

/**
 * Console log WebSocket -- padanan "WebSocket Console" di dashboard
 * Django (templates/iclock/active_device_list.html), TAPI di sini
 * berbentuk panel MELAYANG & BISA DIGESER (draggable), bukan panel tetap
 * di bawah tabel -- supaya bisa dipindah menutupi bagian yang tidak
 * sedang dilihat sambil tetap bisa lihat tabel di baliknya.
 */
export function WsConsolePanel() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [position, setPosition] = useState({ x: 24, y: 90 });
  const logIdRef = useRef(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const { status } = useIclockWsMessage((msg: IclockWsMessage) => {
    logIdRef.current += 1;
    const time = new Date().toLocaleTimeString("id-ID");
    setLines((prev) => {
      const next = [...prev, { id: logIdRef.current, time, section: msg.section, text: JSON.stringify(msg.message) }];
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  });

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [lines]);

  function handleDragStart(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function handleDragMove(e: MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, dragRef.current.originX + dx),
      y: Math.max(0, dragRef.current.originY + dy),
    });
  }

  function handleDragEnd() {
    dragRef.current = null;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }

  // Bersihkan listener drag kalau komponen unmount di tengah drag (jarang, tapi jaga-jaga).
  useEffect(() => () => {
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Terminal className="h-3.5 w-3.5" /> Console
      </Button>
    );
  }

  return (
    <div
      className="fixed z-50 w-[40rem] overflow-hidden rounded-lg border border-border shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onMouseDown={handleDragStart}
        className="flex cursor-move select-none items-center justify-between bg-secondary px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Terminal className="h-3.5 w-3.5" /> WebSocket Console (/ws/iclock)
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={status} />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLines([])} aria-label="Bersihkan log">
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)} aria-label="Tutup console">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div
        ref={logContainerRef}
        className="h-56 space-y-0.5 overflow-y-auto bg-black p-3 font-mono text-[11px] text-emerald-400"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground">Menunggu event WebSocket...</p>
        ) : (
          lines.map((line) => (
            <div key={line.id}>
              [{line.time}] ({line.section}) {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
