"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudflareRecordFormDialog } from "./cloudflare-record-form-dialog";

export function AddCloudflareRecordButton({ zoneId }: { zoneId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Tambah Record
      </Button>
      <CloudflareRecordFormDialog mode="add" zoneId={zoneId} open={open} onOpenChange={setOpen} />
    </>
  );
}
