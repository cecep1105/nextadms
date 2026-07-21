import Link from "next/link";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MobilePoolLoc } from "@/types/api";

export default async function MobilePoolLocationsPage() {
  // Data ini biasanya tidak besar (jumlah pool x rata2 titik polygon) --
  // ambil semua sekaligus (page_size besar) & kelompokkan per PoolID di sini,
  // krn API mengembalikan baris per-titik (flat), bukan sudah dikelompokkan.
  const data = await apiServerFetch<Paginated<MobilePoolLoc>>("/mclock/mobile-pool-loc/?page_size=1000");

  const grouped = new Map<string, MobilePoolLoc[]>();
  for (const point of data.results) {
    const list = grouped.get(point.PoolID) ?? [];
    list.push(point);
    grouped.set(point.PoolID, list);
  }
  const pools = Array.from(grouped.entries()).map(([poolId, points]) => ({
    poolId,
    points: points.sort((a, b) => a.Urut - b.Urut),
  }));

  return (
    <div>
      <PageHeader
        title="Mobile Pool Location (Geofence)"
        description="Titik polygon geofence per Pool -- klik 'Gambar di Peta' untuk menggambar/mengedit visual."
        action={
          <Button size="sm" asChild>
            <Link href="/mclock/mobile-pool-locations/draw">
              <MapPin className="h-3.5 w-3.5" /> Gambar Polygon Baru
            </Link>
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool ID</TableHead>
              <TableHead>Jumlah Titik</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Titik Pertama</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pools.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada polygon geofence tersimpan.</TableCell></TableRow>
            ) : (
              pools.map(({ poolId, points }) => (
                <TableRow key={poolId}>
                  <TableCell className="font-mono font-medium">{poolId}</TableCell>
                  <TableCell className="text-muted-foreground">{points.length} titik</TableCell>
                  <TableCell>
                    {points.length >= 3 ? (
                      <Badge variant="success">Valid</Badge>
                    ) : (
                      <Badge variant="warning">Kurang titik (min. 3)</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {points[0] ? `${points[0].Latitude}, ${points[0].Longitude}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/mclock/mobile-pool-locations/draw/${encodeURIComponent(poolId)}`}>
                          <MapPin className="h-3.5 w-3.5" /> Edit di Peta
                        </Link>
                      </Button>
                    </div>
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
