import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { vsphereRequest } from "@/lib/vsphere-client";
import type { VsphereVm } from "@/types/api";

// Lihat catatan yg sama di hosts/page.tsx.
export const dynamic = "force-dynamic";

async function getVms(): Promise<VsphereVm[]> {
  const data = await vsphereRequest<{ value: VsphereVm[] }>("GET", "/rest/vcenter/vm");
  return data.value;
}

function formatMemory(mib: number): string {
  if (mib >= 1024) return `${(mib / 1024).toFixed(1)} GB`;
  return `${mib} MB`;
}

export default async function VmwareVmsPage() {
  const vms = await getVms();
  const poweredOnCount = vms.filter((vm) => vm.power_state === "POWERED_ON").length;

  return (
    <div>
      <PageHeader title="NetMgmt / VMware / VM Guest" description={`Virtual machine di vCenter (${vms.length} VM, ${poweredOnCount} powered on).`} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Power State</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>Memory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vms.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada VM ditemukan.</TableCell></TableRow>
            ) : (
              vms.map((vm) => (
                <TableRow key={vm.vm}>
                  <TableCell className="font-medium">{vm.name}</TableCell>
                  <TableCell>
                    <Badge variant={vm.power_state === "POWERED_ON" ? "success" : "secondary"}>{vm.power_state}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{vm.cpu_count} vCPU</TableCell>
                  <TableCell className="text-muted-foreground">{formatMemory(vm.memory_size_MiB)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
