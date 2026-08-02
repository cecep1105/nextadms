import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { DnsZone, DnsZonePartition } from "@/types/api";

export const dynamic = "force-dynamic";

const PARTITION_LABELS: Record<DnsZonePartition, { label: string; variant: "default" | "secondary" | "warning" }> = {
  forest: { label: "Forest", variant: "default" },
  domain: { label: "Domain", variant: "secondary" },
  legacy: { label: "Legacy", variant: "warning" },
};

export default async function PortalAdDnsZonesPage() {
  const data = await apiServerFetch<{ count: number; results: DnsZone[]; partition_errors: string[] }>("/netmgmt/ad/dns/zones/");

  return (
    <div>
      <PageHeader
        title="Active Directory - DNS Zones"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Zone</TableHead>
              <TableHead>Partisi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada zone DNS ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((zone) => {
                const cfg = PARTITION_LABELS[zone.partition];
                return (
                  <TableRow key={zone.dn}>
                    <TableCell className="font-mono font-medium">{zone.name}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Link
                          href={`/portal/ad-dns/${encodeURIComponent(zone.dn)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" /> Lihat Record
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {data.partition_errors.length > 0 && (
        <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <p className="font-medium">Beberapa partisi tidak bisa dicek (mungkin memang tidak ada di AD Anda):</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {data.partition_errors.map((err) => <li key={err}>{err}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
