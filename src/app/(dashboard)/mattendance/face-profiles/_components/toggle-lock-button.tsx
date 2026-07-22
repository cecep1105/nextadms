"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api-client";

export function ToggleLockButton({ id, isLocked }: { id: number; isLocked: boolean }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await request(`/mattendance/admin/face-profiles/${id}/toggle-lock/`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} disabled={loading} aria-label={isLocked ? "Buka kunci" : "Kunci"}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isLocked ? (
        <Lock className="h-3.5 w-3.5 text-warning" />
      ) : (
        <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
