"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Fingerprint, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { navGroups, nonStaffNavGroups, type NavGroup } from "./nav-config";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";

/** Grup berisi 1 item tampil sbg link langsung (spt "Dashboard"/"Manajemen User" di Django) -- 2+ item jadi dropdown collapsible per-aplikasi (spt "Iclock Management"/"Mobile Attendance"). */
function groupContainsPath(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

function NavLink({
  item, collapsed, onNavigate, nested,
}: {
  item: NavGroup["items"][number];
  collapsed: boolean;
  onNavigate?: () => void;
  /** Item di dalam dropdown grup -- indentasi lebih & sedikit lebih kecil, meniru submenu Django. */
  nested?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors",
        nested ? "px-2 pl-7" : "px-2",
        collapsed && "justify-center px-2",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  /** Mode ikon-saja (cuma utk varian desktop -- Sheet mobile SELALU full, tidak dipengaruhi preferensi collapse desktop). */
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isStaff = session?.user?.is_staff || session?.user?.is_superuser;
  // Akun non-staff CUMA lihat menu Akun Saya -- sisanya (Active Device dkk)
  // akan 403 kalau dipaksa akses, jadi jangan ditampilkan sama sekali
  // (middleware.ts JUGA sudah block navigasi langsungnya, ini cuma
  // memastikan UI-nya tidak menyesatkan dgn nawarin menu yg toh ditolak).
  const groups = isStaff ? navGroups : nonStaffNavGroups;

  // Grup mana yang lagi terbuka -- default: grup yang MEMUAT halaman
  // AKTIF saat ini otomatis terbuka (persis perilaku dashboard Django),
  // sisanya tertutup. User bisa toggle manual sesudahnya (state per-label).
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const group of groups) {
      if (group.items.length > 1 && groupContainsPath(group, pathname)) {
        initial.add(group.label);
      }
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
          <Fingerprint className="h-3.5 w-3.5 text-primary" />
        </div>
        {!collapsed && <span className="truncate font-display text-sm font-semibold tracking-tight">CCPADMS</span>}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {groups.map((group) => {
            // Grup 1 item -- link langsung, TIDAK ada header/dropdown (spt "Dashboard").
            if (group.items.length === 1) {
              return <NavLink key={group.label} item={group.items[0]} collapsed={collapsed} onNavigate={onNavigate} />;
            }

            // Grup 2+ item -- dropdown per-aplikasi, bisa di-collapse/expand.
            const isOpen = openGroups.has(group.label);
            const GroupIcon = group.icon ?? Fingerprint;
            const groupActive = groupContainsPath(group, pathname);

            if (collapsed) {
              // Mode sidebar diciutkan -- tampilkan SEMUA item grup ini langsung (flat),
              // dropdown per-aplikasi cuma relevan saat sidebar full-width.
              return (
                <div key={group.label} className="space-y-0.5 pt-2 first:pt-0">
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                  ))}
                </div>
              );
            }

            return (
              <div key={group.label} className="pt-1 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                    groupActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate text-left">{group.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} collapsed={false} onNavigate={onNavigate} nested />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div className={cn("fixed flex h-screen flex-col transition-[width] duration-200", collapsed ? "w-14" : "w-60")}>
        <div className="min-h-0 flex-1">
          <SidebarContent collapsed={collapsed} />
        </div>
        <div className={cn("flex shrink-0 border-t border-border p-2", collapsed ? "justify-center" : "justify-end")}>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}>
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
