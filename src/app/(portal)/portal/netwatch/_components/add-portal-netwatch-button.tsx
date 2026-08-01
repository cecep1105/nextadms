"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalNetwatchFormDialog } from "./portal-netwatch-form-dialog";

export function AddPortalNetwatchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Tambah Host
      </Button>
      <PortalNetwatchFormDialog mode="add" open={open} onOpenChange={setOpen} />
    </>
  );
}
