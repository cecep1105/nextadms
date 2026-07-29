import { PageHeader } from "@/components/shared/page-header";
import { apiServerFetch } from "@/lib/api-server";
import { NetmgmtWsProvider } from "@/lib/netmgmt-ws-context";
import type { MikrotikNetwatchItem } from "@/types/api";
import { NetwatchLiveView } from "./_components/netwatch-live-view";

// Sama seperti dhcp/page.tsx -- env var server-only, default = nilai lama.
// PENTING: IP router netwatch BEDA dari dhcp/fwfilter (.1 vs .254) -- ini
// KEMUNGKINAN BESAR memang 2 router fisik BERBEDA (bukan salah ketik),
// makanya env var-nya SENGAJA dipisah per-halaman, bukan 1 env var yg dishare.
const ROUTER_IP = process.env.MIKROTIK_NETWATCH_ROUTER_IP || "10.100.202.1";
const BASE_PATH = `/netmgmt/routeros/${ROUTER_IP}/tool-netwatch`;

// TIDAK ada pagination/sort/search server-side lagi di sini (BEDA dari
// halaman Mikrotik lain) -- lihat catatan lengkap di
// _components/netwatch-live-view.tsx knp data ini dikelola penuh di
// client (live update WebSocket selalu bawa DAFTAR LENGKAP, bukan 1 halaman).
async function getAllNetwatchItems(): Promise<MikrotikNetwatchItem[]> {
  const data = await apiServerFetch<{ results: MikrotikNetwatchItem[] }>(`${BASE_PATH}/?_limit=1000`);
  return data.results;
}

export default async function MikrotikNetwatchPage() {
  const items = await getAllNetwatchItems();

  return (
    <NetmgmtWsProvider>
      <div>
        <PageHeader title="NetMgmt / Mikrotik Netwatch" description="Mikrotik Host Monitoring -- live, update otomatis saat status berubah." />
        <NetwatchLiveView initialData={items} basePath={BASE_PATH} />
      </div>
    </NetmgmtWsProvider>
  );
}
