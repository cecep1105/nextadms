"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CloudflareDnsRecord } from "@/types/api";
import { CloudflareRecordFormDialog } from "@/app/(dashboard)/netmgmt/cloudflare/zones/[zoneId]/_components/cloudflare-record-form-dialog";

/**
 * Versi PORTAL dari CloudflareRecordActionsMenu (staff) -- HANYA tombol
 * Edit, TIDAK ADA tombol Hapus (SENGAJA, sesuai batasan yg disepakati:
 * portal boleh tambah/edit DNS record, TIDAK BOLEH hapus). Dialog form
 * (CloudflareRecordFormDialog) DIPAKAI ULANG APA ADANYA dari staff --
 * generik, tidak ada logic khusus staff di dalamnya, & endpoint yg
 * dipanggilnya (POST .../records/action/) SUDAH permission-nya
 * diperluas terima izin portal can_view_cloudflare utk action edit
 * (lihat netmgmt/cloudflare_view.py::HasCloudflarePermission).
 */
export function PortalCloudflareRecordActionsMenu({ zoneId, record }: { zoneId: string; record: CloudflareDnsRecord }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CloudflareRecordFormDialog mode="edit" zoneId={zoneId} record={record} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
