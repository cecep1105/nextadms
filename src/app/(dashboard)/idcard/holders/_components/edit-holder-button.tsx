"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IDCardHolder } from "@/types/api";
import { HolderFormDialog } from "./holder-form-dialog";

export function EditHolderButton({ holder }: { holder: IDCardHolder }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <HolderFormDialog mode="edit" holder={holder} open={open} onOpenChange={setOpen} />
    </>
  );
}
