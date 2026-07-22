"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export function ToggleLockButton({ id, isLocked }: { id: number; isLocked: boolean }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      await request(`/mattendance/admin/face-profiles/${id}/toggle-lock/`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah status kunci."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleToggle} disabled={loading} aria-label={isLocked ? "Buka kunci" : "Kunci"}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isLocked ? (
            <Lock className="h-3.5 w-3.5 text-warning" />
          ) : (
            <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      {error && <PopoverContent className="w-64 text-xs text-destructive">{error}</PopoverContent>}
    </Popover>
  );
}
