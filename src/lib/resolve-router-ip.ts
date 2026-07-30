import { apiServerFetch } from "@/lib/api-server";

/**
 * Tentukan IP router yang dipakai 1 halaman Mikrotik (DHCP Lease/
 * Firewall Filter), urutan prioritas:
 *   1. Param URL `?router=` (user pilih manual lewat dropdown, lihat
 *      components/netmgmt/router-selector.tsx)
 *   2. Default yang diset admin lewat Django Admin (`NetmgmtRouterDefault`,
 *      lihat netmgmt/router_choices_view.py::RouterDefaultView)
 *   3. Env var lama (`envFallback`) -- MENJAGA KOMPATIBILITAS dgn setup
 *      yang SUDAH jalan sebelum fitur dropdown ini ada (kalau admin
 *      belum sempat set default baru, PERILAKU LAMA tetap sama).
 */
export async function resolveRouterIp(
  pageKey: "dhcp" | "fwfilter",
  routerParam: string | undefined,
  envFallback: string
): Promise<string> {
  if (routerParam) return routerParam;

  try {
    const data = await apiServerFetch<{ router_ip: string | null }>(`/netmgmt/router-default/?page=${pageKey}`);
    if (data.router_ip) return data.router_ip;
  } catch {
    // Gagal ambil default (mis. belum login/network) -- jatuh ke env var, JANGAN gagalkan seluruh halaman cuma krn ini.
  }

  return envFallback;
}
