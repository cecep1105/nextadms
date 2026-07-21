import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar />
        <main className="flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
