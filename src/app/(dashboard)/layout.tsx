import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
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
    </SidebarProvider>
  );
}
