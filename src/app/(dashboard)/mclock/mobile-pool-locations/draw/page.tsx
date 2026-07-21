import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PoolLocationMapDrawer } from "@/components/shared/pool-location-map-drawer";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, MobilePool } from "@/types/api";

export default async function DrawNewPolygonPage() {
  const poolsData = await apiServerFetch<Paginated<MobilePool>>("/mclock/mobile-pool/?page_size=200");

  return (
    <div>
      <PageHeader
        title="Gambar Polygon di Peta"
        description={
          <Link href="/mclock/mobile-pool-locations" className="text-primary hover:underline">
            ← Kembali ke Mobile Pool Location
          </Link>
        }
      />
      <PoolLocationMapDrawer poolId="" existingPoints={[]} knownPoolIds={poolsData.results.map((p) => p.PoolID)} />
    </div>
  );
}
