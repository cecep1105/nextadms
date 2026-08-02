import { CircleCheck, CircleX, CircleDashed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MikrotikNetwatchItem } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary"; icon: typeof CircleCheck }> = {
  up: { label: "Up", variant: "success", icon: CircleCheck },
  down: { label: "Down", variant: "destructive", icon: CircleX },
  waiting: { label: "Waiting", variant: "warning", icon: CircleDashed },
  initializing: { label: "Initializing", variant: "secondary", icon: CircleDashed },
};

/**
 * Versi PORTAL dari NetwatchCard (staff) -- READ-ONLY SEPENUHNYA, TIDAK
 * ADA NetwatchActionsMenu di bawahnya (SENGAJA, scope portal utk
 * Netwatch DIUBAH jadi lihat saja -- lihat netmgmt/portal_views.py::
 * PortalNetwatchActionView, permission-nya DIKEMBALIKAN staff-only).
 */
export function PortalNetwatchCard({ item }: { item: MikrotikNetwatchItem }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.waiting;
  const StatusIcon = cfg.icon;
  const isDown = item.status === "down";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isDown ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold">{item.host}</p>
          {item.comment && <p className="mt-0.5 truncate text-xs text-muted-foreground" title={item.comment}>{item.comment.split('|')[0] ?? ''}</p>}
        </div>
        <Badge variant={cfg.variant} className="shrink-0 gap-1">
          <StatusIcon className="h-3 w-3" /> {cfg.label}
        </Badge>
      </div>

      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Since: {item.since ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Interval: {item.interval ?? "-"}</span>
          <span>Timeout: {item.timeout ?? "-"}</span>
        </div>
        {item.disabled === "true" && <Badge variant="secondary" className="mt-1">Disabled</Badge>}
      </div>
    </div>
  );
}
