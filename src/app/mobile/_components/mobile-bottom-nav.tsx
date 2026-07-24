"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, Utensils, History, LogOut } from "lucide-react";
import { useMobileAuth } from "@/lib/mobile-auth-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/mobile/checkin", label: "Absen", icon: Fingerprint },
  { href: "/mobile/checkin/meal", label: "Meal", icon: Utensils },
  { href: "/mobile/history", label: "Riwayat", icon: History },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { logout } = useMobileAuth();

  return (
    <nav className="sticky bottom-0 z-30 flex items-center border-t border-border bg-background/95 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground"
      >
        <LogOut className="h-4.5 w-4.5" />
        Keluar
      </button>
    </nav>
  );
}
