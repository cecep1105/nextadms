"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

/** Privilege 14 = Admin di device fisik (lihat iclock/zk_client.py::PRIVILEGE_ADMIN) -- BEDA numeric-nya dari "Administrator"=6 di dropdown Privilege form, konvensi lama yang dipertahankan apa adanya. */
const PRIVILEGE_ADMIN = 14;

export function SetAdminButton({ employeeId, privilege }: { employeeId: number; privilege: number | null }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = privilege === PRIVILEGE_ADMIN;

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const result = await request<{ device_synced: boolean; device_error: string | null }>(
        `/iclock/device-user/${employeeId}/toggle-privilege/`,
        { method: "POST" }
      );
      if (result.device_error) {
        setError(`Privilege di database berubah, TAPI gagal sync ke device fisik: ${result.device_error}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah privilege."));
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
    </Button>
  );

  return (
    <Popover open={!!error} onOpenChange={(open) => !open && setError(null)}>
      <PopoverTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{isAdmin ? "Cabut Admin" : "Set as Admin"}</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      {error && <PopoverContent className="w-72 text-xs text-warning">{error}</PopoverContent>}
    </Popover>
  );
}
