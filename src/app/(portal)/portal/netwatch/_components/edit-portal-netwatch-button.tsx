"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MikrotikNetwatchItem } from "@/types/api";
import { PortalNetwatchFormDialog } from "./portal-netwatch-form-dialog";

export function EditPortalNetwatchButton({ item }: { item: MikrotikNetwatchItem }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <PortalNetwatchFormDialog mode="edit" item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
