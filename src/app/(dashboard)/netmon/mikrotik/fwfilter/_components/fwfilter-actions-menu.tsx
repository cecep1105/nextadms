"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Power, Clock, HardDriveDownload, Users, Loader2,
  Network, Settings2, Fingerprint, Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import { MikrotikFirewallFilterRule } from "@/types/api";



export function FwFilterActionsMenu({
    hostdata,

}:{
    hostdata: MikrotikFirewallFilterRule;

}) {

  const router = useRouter();
  const { request } = useApiClient();

  const [enableFwFilterConfirmOpen, setEnableFwFilterConfirmOpen] = useState(false);
  const [disableFwFilterConfirmOpen, setDisableFwFilterConfirmOpen] = useState(false);  
  const [enableFwFilterLoading, setEnableFwFilterLoading] = useState(false);
  const [disableFwFilterLoading, setDisableFwFilterLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);


  async function handleEnableFwFilter() {
    setEnableFwFilterLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`/netmon/mikrotik/10.100.202.254/ip-firewall-filter/?postcmd=enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id}),
      });
      setActionResult(result);
      setEnableFwFilterConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal enable firewall filter.") });
    } finally {
      setEnableFwFilterLoading(false);
    }
  }
  async function handleDisableFwFilter() {
    setDisableFwFilterLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`/netmon/mikrotik/10.100.202.254/ip-firewall-filter/?postcmd=disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id }),
      });
      setActionResult(result);
      setDisableFwFilterConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal disable firewall filter.") });
    } finally {
      setDisableFwFilterLoading(false);
    }
  }

  return (
    <>
      <Popover open={!!actionResult} onOpenChange={(open) => !open && setActionResult(null)}>
        <PopoverTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" aria-label="Aksi FwFilter">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hostdata.disabled === "true" ?
              <DropdownMenuItem onClick={() => setEnableFwFilterConfirmOpen(true)}>
                <Power className="h-3.5 w-3.5 mr-3" /> Enable
              </DropdownMenuItem>
              :
              <DropdownMenuItem onClick={() => setDisableFwFilterConfirmOpen(true)} className="text-destructive focus:text-destructive">
                <Power className="h-3.5 w-3.5 mr-3" /> Disable
              </DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </PopoverTrigger>
        {actionResult && (
          <PopoverContent className={`w-72 text-xs ${actionResult.success ? "text-success" : "text-destructive"}`}>
            {actionResult.message}
          </PopoverContent>
        )}
      </Popover>


      <Dialog open={enableFwFilterConfirmOpen} onOpenChange={setEnableFwFilterConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Jadikan Static?</DialogTitle>
            <DialogDescription>
              Rule dengan src-mac-address <span className="font-mono font-medium text-foreground">{hostdata["src-mac-address"]}</span> ({hostdata["comment"]}) akan di-enable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnableFwFilterConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleEnableFwFilter} disabled={enableFwFilterLoading}>
              {enableFwFilterLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={disableFwFilterConfirmOpen} onOpenChange={setDisableFwFilterConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Static Lease?</DialogTitle>
            <DialogDescription>
              Rule dengan src-mac-address <span className="font-mono font-medium text-foreground">{hostdata["src-mac-address"]}</span> ({hostdata["comment"]}) akan disable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableFwFilterConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDisableFwFilter} disabled={disableFwFilterLoading}>
              {enableFwFilterLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>










    </>
  );


}
