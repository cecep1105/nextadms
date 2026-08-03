"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HolderFormDialog } from "./holder-form-dialog";

export function AddHolderButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah Data</Button>
      <HolderFormDialog mode="add" open={open} onOpenChange={setOpen} />
    </>
  );
}
