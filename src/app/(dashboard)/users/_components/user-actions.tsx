"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserX, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export function ToggleActiveButton({ userId, isActive, disabled, disabledReason }: { userId: number; isActive: boolean; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await request(`/users/${userId}/toggle-active/`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah status."));
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={disabled || loading} title={disabled ? disabledReason : undefined}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isActive ? <UserCheck className="h-3.5 w-3.5 text-success" /> : <UserX className="h-3.5 w-3.5 text-muted-foreground" />}
    </Button>
  );

  return (
    <Popover open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <PopoverTrigger asChild>
        {disabled ? button : (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>{isActive ? "Nonaktifkan user" : "Aktifkan user"}</TooltipContent>
          </Tooltip>
        )}
      </PopoverTrigger>
      {error && <PopoverContent className="w-64 text-xs text-destructive">{error}</PopoverContent>}
    </Popover>
  );
}

/** Set Staff -- HANYA muncul kalau current user (yang login) superuser (dicek di halaman list, bukan di sini). */
export function SetStaffButton({ userId, isStaff, disabled, disabledReason }: { userId: number; isStaff: boolean; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await request(`/users/${userId}/set-staff/`, { method: "POST", body: JSON.stringify({ is_staff: !isStaff }) });
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah role."));
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={disabled || loading} title={disabled ? disabledReason : undefined}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isStaff ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
    </Button>
  );

  return (
    <Popover open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <PopoverTrigger asChild>
        {disabled ? button : (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>{isStaff ? "Cabut akses Staff" : "Jadikan Staff"}</TooltipContent>
          </Tooltip>
        )}
      </PopoverTrigger>
      {error && <PopoverContent className="w-64 text-xs text-destructive">{error}</PopoverContent>}
    </Popover>
  );
}
