import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { vsphereRequest } from "@/lib/vsphere-client";
import { parseListParams, paginateSortFilter } from "@/lib/list-utils";
import type { VsphereVm } from "@/types/api";

// Lihat catatan yg sama di hosts/page.tsx (force-dynamic + pagination/
// sort/search dikerjakan di Next.js sendiri, lihat src/lib/list-utils.ts).
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getVms(): Promise<VsphereVm[]> {
  const data = await vsphereRequest<{ value: VsphereVm[] }>("GET", "/rest/vcenter/vm");
  return data.value;
}

function formatMemory(mib: number): string {
  if (mib >= 1024) return `${(mib / 1024).toFixed(1)} GB`;
  return `${mib} MB`;
}

export default async function VmwareVmsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const allVms = await getVms();
  // Dihitung dari SELURUH VM (SEBELUM dipaginasi/difilter) -- angka
  // ringkasan global, sama pola dgn indikator Mail Queue/Netwatch
  // sebelumnya, TIDAK berubah tergantung halaman/pencarian yg aktif.
  const poweredOnCount = allVms.filter((vm) => vm.power_state === "POWERED_ON").length;

  const params = parseListParams(sp, "name");
  if (!params.searchFields.length) params.searchFields = ["name", "power_state"];
  const data = paginateSortFilter(allVms, params);

  return (
    <div>
      <PageHeader title="NetMgmt / VMware / VM Guest" description={`Virtual machine di vCenter (${allVms.length} VM, ${poweredOnCount} powered on).`} />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama VM" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="power_state" label="Power State" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="cpu_count" label="CPU" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="memory_size_MiB" label="Memory" /></TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada VM ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((vm) => (
                <TableRow key={vm.vm}>
                  <TableCell className="font-medium">{vm.name}</TableCell>
                  <TableCell>
                    <Badge variant={vm.power_state === "POWERED_ON" ? "success" : "secondary"}>{vm.power_state}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{vm.cpu_count} vCPU</TableCell>
                  <TableCell className="text-muted-foreground">{formatMemory(vm.memory_size_MiB)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Link href={`/netmgmt/vmware/vms/${vm.vm}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Detail <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={params.limit} currentPage={params.page} />
      </Card>
    </div>
  );
}
