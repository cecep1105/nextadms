import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PoolLocationMapDrawer } from "@/components/shared/pool-location-map-drawer";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MobilePool, MobilePoolLoc } from "@/types/api";

export default async function DrawEditPolygonPage({ params }: { params: { poolId: string } }) {
  const poolId = decodeURIComponent(params.poolId);

  const [locData, poolsData] = await Promise.all([
    apiServerFetch<Paginated<MobilePoolLoc>>(`/mclock/mobile-pool-loc/?q=${encodeURIComponent(poolId)}&page_size=200`),
    apiServerFetch<Paginated<MobilePool>>("/mclock/mobile-pool/?page_size=200"),
  ]);

  // ?q= adalah pencarian substring (icontains), jadi filter LAGI di sini
  // supaya cocok PERSIS PoolID ini saja (bukan PoolID lain yg kebetulan mengandung substring sama).
  const points = locData.results
    .filter((p) => p.PoolID === poolId)
    .sort((a, b) => a.Urut - b.Urut)
    .map((p) => ({ Latitude: p.Latitude, Longitude: p.Longitude }));

  return (
    <div>
      <PageHeader
        title={`Edit Polygon — ${poolId}`}
        description={
          <Link href="/mclock/mobile-pool-locations" className="text-primary hover:underline">
            ← Kembali ke Mobile Pool Location
          </Link>
        }
      />
      <PoolLocationMapDrawer poolId={poolId} existingPoints={points} knownPoolIds={poolsData.results.map((p) => p.PoolID)} />
    </div>
  );
}
