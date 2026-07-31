"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ITInfraCategory } from "@/types/api";
import { ItInfraFormDialog } from "./itinfra-form-dialog";

export function AddItInfraButton({ categories }: { categories: ITInfraCategory[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={categories.length === 0}>
        <Plus className="h-3.5 w-3.5" /> Tambah Data
      </Button>
      <ItInfraFormDialog mode="add" categories={categories} open={open} onOpenChange={setOpen} />
    </>
  );
}
