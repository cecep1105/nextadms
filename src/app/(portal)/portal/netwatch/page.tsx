import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { apiServerFetch } from "@/lib/api-server";
import type { MikrotikNetwatchItem } from "@/types/api";
import { PortalNetwatchLiveView } from "./_components/portal-netwatch-live-view";

// Data LANGSUNG dari router Mikrotik, WAJIB dynamic. SEMUA host diambil
// SEKALIGUS (_limit besar, TANPA pagination) -- SAMA pola dgn halaman
// staff (lihat catatan lengkap di portal-netwatch-live-view.tsx),
// krn update SETELAHNYA murni via WebSocket (daftar LENGKAP tiap
// broadcast), rekonsiliasi dgn pagination server-side jadi rumit tanpa
// banyak manfaat.
export const dynamic = "force-dynamic";

export default async function PortalNetwatchPage() {
  const data = await apiServerFetch<{ results: MikrotikNetwatchItem[] }>("/netmgmt/portal/netwatch/?_limit=1000");

  return (
    <div>
      <PageHeader
        title="Netwatch"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
      <PortalNetwatchLiveView initialData={data.results} />
    </div>
  );
}
