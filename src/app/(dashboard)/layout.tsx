import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { NetmgmtWsProvider } from "@/lib/netmgmt-ws-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* NetmgmtWsProvider di level layout (GLOBAL utk seluruh dashboard
          staff) -- supaya Topbar (indikator jumlah mail queue active/host
          netwatch down, SELALU tampil di semua halaman) JUGA bisa akses
          koneksi WebSocket yang SAMA, tanpa perlu buka halaman Mail
          Queue/Netwatch dulu. Halaman yang tadinya py <NetmgmtWsProvider>
          sendiri SUDAH DIHAPUS wrapper-nya (lihat page.tsx masing2) --
          JANGAN bungkus DUA KALI (bikin 2 koneksi WS terpisah percuma). */}
      <NetmgmtWsProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* PENTING: TIDAK ada padding tambahan di sini -- <Sidebar> SUDAH
              mereservasi ruangnya sendiri lewat flexbox (w-60/w-14, shrink-0).
              Menambah lg:pl-60 DI SINI JUGA (seperti versi sebelumnya) bikin
              ruang sidebar dihitung DUA KALI -- itu penyebab celah kosong
              selebar sidebar yang dilaporkan. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 p-3 sm:p-5">{children}</main>
          </div>
        </div>
      </NetmgmtWsProvider>
    </SidebarProvider>
  );
}
