import { PortalHeader } from "./portal/_components/portal-header";
import { NetmgmtWsProvider } from "@/lib/netmgmt-ws-context";

// NetmgmtWsProvider di level layout (GLOBAL utk seluruh portal) --
// KONSUMEN PERTAMA-nya di portal adalah Netwatch (card live-update,
// lihat portal/netwatch/_components/portal-netwatch-live-view.tsx),
// TAPI dipasang di layout (bukan per-halaman) supaya fitur portal LAIN
// yang nanti butuh WS juga tinggal pakai koneksi yang SAMA, tidak
// perlu bungkus provider sendiri2 (BUKAN duplikat dari
// (dashboard)/layout.tsx -- itu provider TERPISAH, khusus staff,
// masing2 route group cuma py 1 aktif dalam satu waktu, TIDAK bikin 2
// koneksi WS sekaligus). Consumer WS di Django (netmgmt/consumers.py::
// NetmgmtConsumer) cuma cek is_authenticated (BUKAN is_staff), jadi
// user portal MEMANG SUDAH BISA konek dari awal, cuma belum ada
// provider-nya di sisi Next.js sebelum ini.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <NetmgmtWsProvider>
      <div className="flex min-h-screen flex-col">
        <PortalHeader />
        <main className="mx-auto w-full max-w-3xl md:max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </NetmgmtWsProvider>
  );
}
