"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Fingerprint, ChevronsLeft, ChevronsRight } from "lucide-react";
import { navGroups, nonStaffNavGroups } from "./nav-config";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";

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

  return (
    <div className="flex h-full flex-col bg-card">
      <div className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
          <Fingerprint className="h-3.5 w-3.5 text-primary" />
        </div>
        {!collapsed && <span className="truncate font-display text-sm font-semibold tracking-tight">CCPADMS</span>}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                        collapsed && "justify-center",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                  if (!collapsed) return link;
                  return (
                    <Tooltip key={item.href} delayDuration={100}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
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
