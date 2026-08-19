"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, SeparatorVertical, Menu, SquareArrowRight } from "lucide-react";
import type { ComponentType } from "react";
import type { icons, LucideProps } from "lucide-react";
import { DynamicIcon } from 'lucide-react/dynamic';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navGroups, type NavItem, type NavGroup } from "./nav-config";

interface BreadcrumbOption {
  label: string;
  /** Href TUJUAN kalau opsi ini diklik -- utk item "folder" (children, tanpa href sendiri), pakai href child PERTAMANYA (folder sendiri bukan halaman). */
  href: string;
  isCurrent: boolean;
}

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: ComponentType<LucideProps>;
  /** Opsi lain SETINGKAT (sibling) yang bisa dipilih lewat dropdown di segmen ini. Kosong kalau cuma 1 opsi (dropdown tidak berguna). */
  options: BreadcrumbOption[];
}

/** Href navigasi utk 1 opsi breadcrumb -- item biasa pakai href sendiri, item "folder" (py children, tanpa href) pakai href child PERTAMANYA. */
function resolveHref(item: NavItem): string | undefined {
  if (item.href) return item.href;
  return item.children?.[0] ? resolveHref(item.children[0]) : undefined;
}


function buildOptions(items: NavItem[], current: NavItem): BreadcrumbOption[] {
  const options = items
    .map((item) => ({ label: item.title, href: resolveHref(item), isCurrent: item === current }))
    .filter((opt): opt is BreadcrumbOption => !!opt.href);
  return options.length > 1 ? options : [];
}

function matchInItems(items: NavItem[], pathname: string): BreadcrumbSegment[] | null {
  for (const item of items) {
    if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
      return [{ label: item.title, icon:item.icon, href: item.href, options: buildOptions(items, item) }];
    }
    if (item.children && item.children.length > 0) {
      const deeper = matchInItems(item.children, pathname);
      if (deeper) {
        return [{ label: item.title, href: resolveHref(item), options: buildOptions(items, item) }, ...deeper];
      }
    }
  }
  return null;
}

function findBreadcrumb(pathname: string): BreadcrumbSegment[] {
  for (const group of navGroups) {
    const matched = matchInItems(group.items, pathname);
    if (matched) {
      // Grup 1-item (spt "Dashboard") TIDAK perlu segmen grup terpisah --
      // labelnya SAMA PERSIS dgn satu2nya item di dalamnya, redundan kalau ditampilkan 2x.
      if (group.items.length === 1) return matched;
      return [{ label: group.desc ?? group.label, options: [] }, ...matched];
    }
  }
  return [{ label: "Dashboard", href: "/", options: [] }];
}

function BreadcrumbSegmentView({ segment, isLast, isFirst, topbar }: { segment: BreadcrumbSegment; isLast: boolean; isFirst: boolean; topbar: boolean }) {
  const textClass = isFirst ? "text-xl font-bold text-green-600" : "text-muted-foreground";

  if (segment.options.length === 0) {
    // Tidak ada sibling utk dipilih -- tampil sbg teks/link biasa, TANPA dropdown (percuma).
    return segment.href && topbar ? (
      <Link href={segment.href} className={`truncate hover:underline ${textClass}`}>{segment.label}</Link>
    ) : (
      <span className={`truncate ${textClass}`}>{topbar? segment.label : ''}</span>

    );
  }

  // ADA sibling -- jadi dropdown, supaya bisa lompat ke menu lain LEWAT
  // breadcrumb tanpa perlu buka sidebar (paling berguna saat sidebar
  // sedang diciutkan/collapsed -- permintaan eksplisit fitur ini).

  if (topbar) {
    return (<div></div>);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`inline-flex items-center gap-0.5 truncate rounded px-1 -mx-1 hover:bg-secondary ${textClass}`}>
        {segment.label}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {segment.options.map((opt) => (
          <DropdownMenuItem key={opt.label} asChild className={opt.isCurrent ? "bg-accent" : ""}>
            <Link href={opt.href}>{opt.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Breadcrumb INTERAKTIF -- tiap segmen yang punya sibling (mis. "Mikrotik"
 * bisa diganti "Mail Server (Zentyal)"/"Active Directory", atau "DHCP
 * Leases" bisa diganti "Firewall Filter"/"Netwatch") jadi dropdown, bisa
 * lompat ke halaman LAIN di level yang sama TANPA perlu buka sidebar --
 * paling berguna saat sidebar sedang diciutkan (collapsed).
 */
export function InteractiveBreadcrumb({topbar}:{topbar: boolean}) {
  const pathname = usePathname();
  const segments = findBreadcrumb(pathname);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
      {segments.map((segment, i) => (
        <span key={`${segment.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
          {i > 1 && !topbar && <span className="text-muted-foreground">|</span>}
          {i === 1 && !topbar && <SquareArrowRight className="-ml-2 w-6 h-4" /> }
          <BreadcrumbSegmentView segment={segment} isLast={i === segments.length - 1} isFirst={i === 0} topbar={topbar} />
        </span>
      ))}
    </div>
  );
}
