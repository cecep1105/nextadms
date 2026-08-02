"use client";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItInfraViewDetailDialog } from "./itinfra-view-detail-dialog";

export function ViewItInfraDetailButton({ entryId, entryName }: { entryId: number; entryName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Eye className="h-3.5 w-3.5" /> Lihat
      </Button>
      <ItInfraViewDetailDialog entryId={entryId} entryName={entryName} open={open} onOpenChange={setOpen} />
    </>
  );
}
