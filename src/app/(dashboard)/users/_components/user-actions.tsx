"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserX, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiClient } from "@/lib/api-client";

export function ToggleActiveButton({ userId, isActive }: { userId: number; isActive: boolean }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await request(`/users/${userId}/toggle-active/`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isActive ? <UserCheck className="h-3.5 w-3.5 text-success" /> : <UserX className="h-3.5 w-3.5 text-muted-foreground" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isActive ? "Nonaktifkan user" : "Aktifkan user"}</TooltipContent>
    </Tooltip>
  );
}

/** Set Staff -- HANYA muncul kalau current user (yang login) superuser (API 403 kalau bukan, tapi disembunyikan dulu di UI). */
export function SetStaffButton({ userId, isStaff }: { userId: number; isStaff: boolean }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await request(`/users/${userId}/set-staff/`, { method: "POST", body: JSON.stringify({ is_staff: !isStaff }) });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isStaff ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isStaff ? "Cabut akses Staff" : "Jadikan Staff"}</TooltipContent>
    </Tooltip>
  );
}
