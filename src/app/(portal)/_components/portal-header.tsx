"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Fingerprint, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function PortalHeader() {
  const { data: session } = useSession();
  const displayName = session?.user?.full_name || session?.user?.username || "";

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Link href="/portal" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
          <Fingerprint className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-display text-sm font-semibold tracking-tight">CCPADMS</span>
      </Link>

      <div className="flex-1" />

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
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
