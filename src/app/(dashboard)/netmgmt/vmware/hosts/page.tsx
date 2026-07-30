import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { vsphereRequest } from "@/lib/vsphere-client";
import type { VsphereHost } from "@/types/api";

// WAJIB -- tanpa ini, Next.js coba STATIC-GENERATE halaman ini saat build
// (krn tidak ada searchParams/cookies() yg otomatis menandai dynamic),
// gagal kalau vCenter belum bisa diakses saat build (mis. .env kosong di
// environment build). Data di sini SELALU harus fresh tiap request, tidak
// boleh di-cache statis sama sekali.
export const dynamic = "force-dynamic";

// Server Component -- panggil vCenter LANGSUNG (server-side, lihat
// src/lib/vsphere-client.ts), BUKAN lewat fetch ke API route sendiri --
// lebih sederhana & tanpa round-trip HTTP tambahan utk sekadar
// menampilkan daftar. API route (/api/vsphere/[...path]) tetap dibangun
// utk kebutuhan CLIENT-side lain nanti (mis. aksi power on/off).

async function getHosts(): Promise<VsphereHost[]> {
  const data = await vsphereRequest<{ value: VsphereHost[] }>("GET", "/rest/vcenter/host");
  return data.value;
}

const CONNECTION_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  CONNECTED: "success",
  DISCONNECTED: "destructive",
  NOT_RESPONDING: "warning",
};

export default async function VmwareHostsPage() {
  const hosts = await getHosts();

  return (
    <div>
      <PageHeader title="NetMgmt / VMware / Host" description={`ESXi host terdaftar di vCenter (${hosts.length} host).`} />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Connection State</TableHead>
              <TableHead>Power State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hosts.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada host ditemukan.</TableCell></TableRow>
            ) : (
              hosts.map((host) => (
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
      </Card>
    </div>
  );
}
