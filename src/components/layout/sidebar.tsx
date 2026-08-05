"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Network, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { navGroups, nonStaffNavGroups, type NavGroup, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";

/** Cek REKURSIF -- true kalau `item` ATAU salah satu `children`-nya (di kedalaman berapa pun) match pathname aktif. Dipakai baik utk grup teratas MAUPUN item bertingkat (mis. "Mikrotik" di dalam "Network Management"). */
function itemContainsPath(item: NavItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) return true;
  return (item.children ?? []).some((child) => itemContainsPath(child, pathname));
}

function groupContainsPath(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => itemContainsPath(item, pathname));
}

function NavLink({
  item, collapsed, onNavigate, depth = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  /** 0 = langsung di bawah grup, 1 = di dalam sub-menu bertingkat (mis. dalam "Mikrotik") -- makin dalam, makin banyak indentasi. */
  depth?: number;
}) {
  const pathname = usePathname();
  const active = !!item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors",
        depth === 0 ? "px-2" : depth === 1 ? "px-2 pl-7" : "px-2 pl-11",
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

/**
 * Render 1 item nav -- kalau item ini PUNYA `children`, jadi dropdown
 * bertingkat SENDIRI (button toggle + chevron, mirip grup teratas tapi
 * dgn indentasi tambahan) -- kalau TIDAK, cuma link biasa (NavLink).
 * REKURSIF by design (children BISA py children lagi kalau nanti perlu
 * lebih dari 2 tingkat, walau sejauh ini cuma dipakai 1 tingkat sub-menu
 * spt Mikrotik/Mail Server/Active Directory di dalam Network Management).
 */
function NavItemRenderer({
  item, collapsed, onNavigate, depth, openKeys, onToggle,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  depth: number;
  openKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const pathname = usePathname();

  if (!item.children || item.children.length === 0) {
    return <NavLink item={item} collapsed={collapsed} onNavigate={onNavigate} depth={depth} />;
  }

  // Item PUNYA children -- jadi dropdown bertingkat. Key unik gabungan
  // title+depth (cukup krn struktur nav statis, tidak akan ada 2 item
  // SAMA PERSIS title-nya di kedalaman yang sama).
  const key = `${depth}-${item.title}`;
  const isOpen = openKeys.has(key);
  const isActive = itemContainsPath(item, pathname);
  const Icon = item.icon;

  if (collapsed) {
    // Sidebar diciutkan -- tampilkan SEMUA children langsung (flat, dgn tooltip
    // masing2), dropdown bertingkat cuma relevan pas sidebar full-width.
    return (
      <div className="space-y-0.5">
        {item.children.map((child) => (
          <NavItemRenderer key={child.title} item={child} collapsed={collapsed} onNavigate={onNavigate} depth={depth} openKeys={openKeys} onToggle={onToggle} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(key)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors",
          depth === 0 ? "px-2" : "px-2 pl-7",
          isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate text-left">{item.title}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <NavItemRenderer key={child.title} item={child} collapsed={false} onNavigate={onNavigate} depth={depth + 1} openKeys={openKeys} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Kumpulkan SEMUA key (title bersarang) yang mengandung pathname aktif, di kedalaman berapa pun -- dipakai auto-expand saat pertama render. */
function collectActiveKeys(items: NavItem[], pathname: string, depth: number, acc: Set<string>) {
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      if (itemContainsPath(item, pathname)) acc.add(`${depth}-${item.title}`);
      collectActiveKeys(item.children, pathname, depth + 1, acc);
    }
  }
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

  // Grup/item bertingkat mana yang lagi terbuka -- default: SEMUA yang
  // MEMUAT halaman AKTIF saat ini (di kedalaman berapa pun) otomatis
  // terbuka, sisanya tertutup. User bisa toggle manual sesudahnya.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const group of groups) {
      if (group.items.length > 1 && groupContainsPath(group, pathname)) {
        initial.add(group.label);
      }
      collectActiveKeys(group.items, pathname, 1, initial);
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
    <div className="sidebar-shell flex h-full flex-col bg-card">
      <div className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
          <Network className="h-3.5 w-3.5 text-primary" />
        </div>
        {!collapsed && <span className="truncate font-display text-sm font-semibold tracking-tight">NEXTADMS</span>}
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
            const GroupIcon = group.icon ?? Network;
            const groupActive = groupContainsPath(group, pathname);

            if (collapsed) {
              // Mode sidebar diciutkan -- tampilkan SEMUA item grup ini langsung (flat, REKURSIF
              // turun ke children jg kalau ada), dropdown bertingkat cuma relevan saat full-width.
              return (
                <div key={group.label} className="space-y-0.5 pt-2 first:pt-0">
                  {group.items.map((item) => (
                    <NavItemRenderer key={item.title} item={item} collapsed={collapsed} onNavigate={onNavigate} depth={0} openKeys={openGroups} onToggle={toggleGroup} />
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
                      <NavItemRenderer key={item.title} item={item} collapsed={false} onNavigate={onNavigate} depth={1} openKeys={openGroups} onToggle={toggleGroup} />
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
        "sidebar-shell hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div className={cn("fixed flex h-screen flex-col transition-[width] duration-200", collapsed ? "w-14" : "w-60")}>
        <div className="min-h-0 flex-1">
          <SidebarContent collapsed={collapsed} />
        </div>
        <div className={cn("flex shrink-0 border-t border-border bg-card p-2", collapsed ? "justify-center" : "justify-end")}>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}>
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
