import Link from "next/link";
import { ArrowLeft, Monitor, HardDrive, Database } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { VmwareVmDetail } from "@/types/api";
import { RemoteGuestButton } from "./_components/remote-guest-button";
import { RebootButton } from "./_components/reboot-button";

// PENTING: halaman ini panggil DJANGO (apiServerFetch, SOAP API via
// pyVmomi -- lihat netmgmt/vmware_view.py), BUKAN vsphere-client.ts
// (REST API langsung ke vCenter, dipakai halaman List di page.tsx induk).
// Detail per-VM (guest OS/IP/tools status + disk & datastore) butuh
// BANYAK property sekaligus -- REST API perlu request terpisah per jenis
// detail (N+1), SOAP PropertyCollector di Django ambil semua dlm 1
// round-trip. List tetap REST/Next.js (sudah cukup & sederhana utk itu).
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ vmId: string }>;
}

async function getVmDetail(vmId: string): Promise<VmwareVmDetail> {
  return apiServerFetch<VmwareVmDetail>(`/netmgmt/vmware/vm-detail/?vm=${encodeURIComponent(vmId)}`);
}

const TOOLS_STATUS_LABEL: Record<string, string> = {
  toolsOk: "Running",
  toolsOld: "Perlu Update",
  toolsNotRunning: "Tidak Berjalan",
  toolsNotInstalled: "Belum Terinstall",
};

export default async function VmwareVmDetailPage({ params }: PageProps) {
  const { vmId } = await params;
  const vm = await getVmDetail(vmId);

  return (
    <div>
      <PageHeader
        title={`NetMgmt / VMware / VM Guest / ${vm.name}`}
        description={
          <Link href="/netmgmt/vmware/vms" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Daftar VM
          </Link>
        }
        action={
          <div className="flex items-center gap-2">
            <RemoteGuestButton vmId={vm.vm} />
            <RebootButton vmId={vm.vm} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Monitor className="h-4 w-4" /> Guest OS &amp; Status
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Power State</dt><dd><Badge variant={vm.power_state === "poweredOn" ? "success" : "secondary"}>{vm.power_state}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Guest OS</dt><dd className="text-right">{vm.guest_full_name ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Hostname</dt><dd className="font-mono">{vm.guest_hostname ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">IP Address</dt><dd className="font-mono">{vm.guest_ip_address ?? "-"}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VMware Tools</dt>
              <dd>
                <Badge variant={vm.tools_status === "toolsOk" ? "success" : "warning"}>
                  {vm.tools_status ? (TOOLS_STATUS_LABEL[vm.tools_status] ?? vm.tools_status) : "-"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-muted-foreground">vCPU</dt><dd>{vm.num_cpu ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Memory</dt><dd>{vm.memory_mb ? `${(vm.memory_mb / 1024).toFixed(1)} GB` : "-"}</dd></div>
          </dl>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <HardDrive className="h-4 w-4" /> Disk
          </div>
          {vm.disks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada disk terdeteksi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Provisioning</TableHead>
                  <TableHead>Datastore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vm.disks.map((disk, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{disk.label}</TableCell>
                    <TableCell className="text-muted-foreground">{disk.capacity_gb} GB</TableCell>
                    <TableCell className="text-muted-foreground">{disk.thin_provisioned ? "Thin" : "Thick"}</TableCell>
                    <TableCell className="text-muted-foreground">{disk.datastore_name ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4" /> Datastore Usage
          </div>
          {vm.datastores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada datastore terdeteksi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Ruang Tersisa</TableHead>
                  <TableHead>Terpakai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vm.datastores.map((ds, i) => {
                  const usedPct = ds.capacity_gb > 0 ? Math.round(((ds.capacity_gb - ds.free_space_gb) / ds.capacity_gb) * 100) : 0;
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell className="text-muted-foreground">{ds.type}</TableCell>
                      <TableCell className="text-muted-foreground">{ds.capacity_gb} GB</TableCell>
                      <TableCell className="text-muted-foreground">{ds.free_space_gb} GB</TableCell>
                      <TableCell>
                        <Badge variant={usedPct >= 90 ? "destructive" : usedPct >= 75 ? "warning" : "secondary"}>{usedPct}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
