"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User as UserIcon, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { SidebarContent } from "./sidebar";
import { navGroups } from "./nav-config";

function useBreadcrumb() {
  const pathname = usePathname();
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { group: group.label, page: item.title };
      }
    }
  }
  return { group: "Utama", page: "Dashboard" };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const breadcrumb = useBreadcrumb();
  const displayName = session?.user?.full_name || session?.user?.username || "";

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
        <span className="truncate text-muted-foreground">{breadcrumb.group}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate font-medium text-foreground">{breadcrumb.page}</span>
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-2 px-1.5">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                {displayName ? initials(displayName) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[8rem] truncate text-xs font-medium sm:inline">{displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">{session?.user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/profile" className="cursor-pointer">
              <UserIcon className="h-3.5 w-3.5" /> Profil Saya
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/profile/password" className="cursor-pointer">
              <KeyRound className="h-3.5 w-3.5" /> Ganti Password
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
