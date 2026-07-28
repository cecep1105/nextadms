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
import { MikrotikDhcpLease } from "@/types/api";



export function DhcpActionsMenu({
    hostdata,
    basepath,

}:{
    hostdata: MikrotikDhcpLease;
    basepath: String;

}) {

  const router = useRouter();
  const { request } = useApiClient();

  const [makeStaticConfirmOpen, setMakeStaticConfirmOpen] = useState(false);
  const [removeStaticConfirmOpen, setRemoveStaticConfirmOpen] = useState(false);  
  const [makeStaticLoading, setMakeStaticLoading] = useState(false);
  const [removeStaticLoading, setRemoveStaticLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);


  async function handleMakeStatic() {
    setMakeStaticLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`${basepath}/?postcmd=make-static`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id}),
      });
      setActionResult(result);
      setMakeStaticConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal membuat static dhcp.") });
    } finally {
      setMakeStaticLoading(false);
    }
  }
  async function handleRemoveStatic() {
    setRemoveStaticLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`${basepath}/?postcmd=remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id }),
      });
      setActionResult(result);
      setRemoveStaticConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal menghapus lease dhcp.") });
    } finally {
      setRemoveStaticLoading(false);
    }
  }












  return (
    <>
      <Popover open={!!actionResult} onOpenChange={(open) => !open && setActionResult(null)}>
        <PopoverTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" aria-label="Aksi Dhcp">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hostdata.dynamic === "true" ?
              <DropdownMenuItem onClick={() => setMakeStaticConfirmOpen(true)}>
                <Power className="h-3.5 w-3.5 mr-3" /> Make Static
              </DropdownMenuItem>
              :
              <DropdownMenuItem onClick={() => setRemoveStaticConfirmOpen(true)} className="text-destructive focus:text-destructive">
                <Power className="h-3.5 w-3.5 mr-3" /> Delete Lease
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


      <Dialog open={makeStaticConfirmOpen} onOpenChange={setMakeStaticConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Jadikan Static?</DialogTitle>
            <DialogDescription>
              Host dengan mac-address <span className="font-mono font-medium text-foreground">{hostdata["mac-address"]}</span> ({hostdata["host-name"]}) akan dijadikan static.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMakeStaticConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleMakeStatic} disabled={makeStaticLoading}>
              {makeStaticLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Jadikan Static
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={removeStaticConfirmOpen} onOpenChange={setRemoveStaticConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Static Lease?</DialogTitle>
            <DialogDescription>
              Host dengan mac-address <span className="font-mono font-medium text-foreground">{hostdata["mac-address"]}</span> ({hostdata["host-name"]}) akan dihapus dari lease.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveStaticConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleRemoveStatic} disabled={removeStaticLoading}>
              {makeStaticLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>










    </>
  );


}
