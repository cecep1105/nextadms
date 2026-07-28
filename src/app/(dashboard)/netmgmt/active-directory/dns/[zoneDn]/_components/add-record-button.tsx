"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordFormDialog } from "./record-form-dialog";

export function AddRecordButton({ zoneDn }: { zoneDn: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Tambah Record
      </Button>
      <RecordFormDialog mode="add" zoneDn={zoneDn} open={open} onOpenChange={setOpen} />
    </>
  );
}
