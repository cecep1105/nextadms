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
import { MikrotikNetwatchItem } from "@/types/api";



export function NetwatchActionsMenu({
    hostdata,
    basepath,

}:{
    hostdata: MikrotikNetwatchItem;
    basepath: String;

}) {

  const router = useRouter();
  const { request } = useApiClient();

  const [disableHostConfirmOpen, setDisableHostConfirmOpen] = useState(false);
  const [enableHostConfirmOpen, setEnableHostConfirmOpen] = useState(false);  
  const [disableHostLoading, setDisableHostLoading] = useState(false);
  const [enableHostLoading, setEnableHostLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);


  async function handleDisableHost() {
    setDisableHostLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`${basepath}/?postcmd=disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id}),
      });
      setActionResult(result);
      setDisableHostConfirmOpen(false);
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal reboot device.") });
    } finally {
      setDisableHostLoading(false);
    }
  }
  async function handleEnableHost() {
    setEnableHostLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`${basepath}/?postcmd=enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({id: hostdata.id }),
      });
      setActionResult(result);
      setEnableHostConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal reboot device.") });
    } finally {
      setEnableHostLoading(false);
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
              {hostdata.disabled === "true" ?
              <DropdownMenuItem onClick={() => setEnableHostConfirmOpen(true)}>
                <Power className="h-3.5 w-3.5 mr-3" /> Enable Host
              </DropdownMenuItem>
              :
              <DropdownMenuItem onClick={() => setDisableHostConfirmOpen(true)} className="text-destructive focus:text-destructive">
                <Power className="h-3.5 w-3.5 mr-3" />Disable Host
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


      <Dialog open={disableHostConfirmOpen} onOpenChange={setDisableHostConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable this host?</DialogTitle>
            <DialogDescription>
              Host dengan ip-address <span className="font-mono font-medium text-foreground">{hostdata["host"]}</span> ({hostdata["comment"]}) akan di-disable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableHostConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDisableHost} disabled={disableHostLoading}>
              {disableHostLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Disable Host
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={enableHostConfirmOpen} onOpenChange={setEnableHostConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enable this host</DialogTitle>
            <DialogDescription>
              Host dengan ip address <span className="font-mono font-medium text-foreground">{hostdata["host"]}</span> ({hostdata["comment"]}) akan di-enable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnableHostConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleEnableHost} disabled={enableHostLoading}>
              {enableHostLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Enable Host
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>










    </>
  );


}
