import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { vsphereRequest } from "@/lib/vsphere-client";
import { parseListParams, paginateSortFilter } from "@/lib/list-utils";
import type { VsphereHost } from "@/types/api";

// WAJIB -- tanpa ini, Next.js coba STATIC-GENERATE halaman ini saat build
// (krn tidak ada searchParams/cookies() yg otomatis menandai dynamic),
// gagal kalau vCenter belum bisa diakses saat build (mis. .env kosong di
// environment build). Data di sini SELALU harus fresh tiap request, tidak
// boleh di-cache statis sama sekali.
export const dynamic = "force-dynamic";

// PAGINATION/SORT/SEARCH DIKERJAKAN DI SINI (bukan Django, lihat
// src/lib/list-utils.ts) -- data dari vCenter REST API langsung, tidak
// ada backend di antaranya utk itu. Konvensi param (_page/_limit/
// _sort_by/_order/_q) SAMA dgn halaman netmgmt lain, jadi komponen UI
// RouterOSSearchBar/PaginationBar/SortableHeader bisa dipakai APA
// ADANYA tanpa modifikasi.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getHosts(): Promise<VsphereHost[]> {
  const data = await vsphereRequest<{ value: VsphereHost[] }>("GET", "/rest/vcenter/host");
  return data.value;
}

const CONNECTION_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  CONNECTED: "success",
  DISCONNECTED: "destructive",
  NOT_RESPONDING: "warning",
};

export default async function VmwareHostsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const allHosts = await getHosts();

  const params = parseListParams(sp, "name");
  if (!params.searchFields.length) params.searchFields = ["name", "connection_state"];
  const data = paginateSortFilter(allHosts, params);

  return (
    <div>
      <PageHeader title="NetMgmt / VMware / Host" description={`ESXi host terdaftar di vCenter (${data.count} host).`} />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama host / connection state" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="connection_state" label="Connection State" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="power_state" label="Power State" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada host ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((host) => (
                <TableRow key={host.host}>
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell>
                    <Badge variant={CONNECTION_VARIANT[host.connection_state] ?? "secondary"}>{host.connection_state}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={host.power_state === "POWERED_ON" ? "success" : "secondary"}>{host.power_state}</Badge>
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
