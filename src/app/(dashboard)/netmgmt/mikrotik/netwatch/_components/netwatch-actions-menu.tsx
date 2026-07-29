"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Power, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { NetwatchFormDialog } from "./netwatch-form-dialog";

export function NetwatchActionsMenu({
  hostdata,
  basepath,
}: {
  hostdata: MikrotikNetwatchItem;
  basepath: string;
}) {
  const router = useRouter();
  const { request } = useApiClient();

  const [disableHostConfirmOpen, setDisableHostConfirmOpen] = useState(false);
  const [enableHostConfirmOpen, setEnableHostConfirmOpen] = useState(false);
  const [disableHostLoading, setDisableHostLoading] = useState(false);
  const [enableHostLoading, setEnableHostLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDisableHost() {
    setDisableHostLoading(true);
    try {
      const result = await request<{ success: boolean; message: string }>(`${basepath}/?postcmd=disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hostdata.id }),
      });
      setActionResult(result);
      setDisableHostConfirmOpen(false);
      router.refresh(); // SEBELUMNYA baris ini TIDAK ADA di sini (cuma ada di handleEnableHost) -- badge "Disabled" jadi tidak ter-update tanpa refresh manual, sudah diperbaiki sekalian.
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal disable host.") });
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
        body: JSON.stringify({ id: hostdata.id }),
      });
      setActionResult(result);
      setEnableHostConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setActionResult({ success: false, message: extractErrorMessage(err, "Gagal enable host.") });
    } finally {
      setEnableHostLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await request(`${basepath}/?postcmd=remove`, {
        method: "POST",
        body: JSON.stringify({ id: hostdata.id }),
      });
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Gagal menghapus host netwatch."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <Popover open={!!actionResult} onOpenChange={(open) => !open && setActionResult(null)}>
        <PopoverTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aksi Netwatch">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-3 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              {hostdata.disabled === "true" ? (
                <DropdownMenuItem onClick={() => setEnableHostConfirmOpen(true)}>
                  <Power className="mr-3 h-3.5 w-3.5" /> Enable Host
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setDisableHostConfirmOpen(true)}>
                  <Power className="mr-3 h-3.5 w-3.5" /> Disable Host
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-3 h-3.5 w-3.5" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PopoverTrigger>
        {actionResult && (
          <PopoverContent className={`w-72 text-xs ${actionResult.success ? "text-success" : "text-destructive"}`}>
            {actionResult.message}
          </PopoverContent>
        )}
      </Popover>

      <NetwatchFormDialog mode="edit" basePath={basepath} item={hostdata} open={editOpen} onOpenChange={setEditOpen} />

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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Host Netwatch?</DialogTitle>
            <DialogDescription>
              Host <span className="font-mono font-medium text-foreground">{hostdata.host}</span> ({hostdata.comment || "tanpa comment"}) akan dihapus permanen dari monitoring netwatch.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{deleteError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
