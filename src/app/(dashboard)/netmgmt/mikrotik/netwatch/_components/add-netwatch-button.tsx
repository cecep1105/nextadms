"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetwatchFormDialog } from "./netwatch-form-dialog";

export function AddNetwatchButton({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Tambah Host
      </Button>
      <NetwatchFormDialog mode="add" basePath={basePath} open={open} onOpenChange={setOpen} />
    </>
  );
}
