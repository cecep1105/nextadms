import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export type StatusKind = "info" | "success" | "error" | null;

/**
 * Overlay pesan status/error -- SENGAJA absolute-positioned DI DALAM
 * container kamera (bukan elemen terpisah di bawahnya spt versi Django
 * lama), supaya muncul/hilangnya TIDAK PERNAH menggeser layout (tombol
 * Check-in/out & kamera SELALU di posisi yang sama persis). Permintaan
 * eksplisit: pesan harus "langsung terlihat tanpa menggeser tampilan".
 */
export function StatusOverlay({ kind, message }: { kind: StatusKind; message: string }) {
  if (!kind) return null;

  const config = {
    info: { bg: "bg-slate-900/90", text: "text-white", icon: <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> },
    success: { bg: "bg-emerald-600/95", text: "text-white", icon: <CheckCircle2 className="h-4 w-4 shrink-0" /> },
    error: { bg: "bg-rose-600/95", text: "text-white", icon: <XCircle className="h-4 w-4 shrink-0" /> },
  }[kind];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2">
      <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-sm ${config.bg} ${config.text}`}>
        {config.icon}
        <span className="leading-snug">{message}</span>
      </div>
    </div>
  );
}
