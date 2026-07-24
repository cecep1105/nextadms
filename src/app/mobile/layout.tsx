"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MobileAuthProvider, useMobileAuth } from "@/lib/mobile-auth-context";
import { MobileBottomNav } from "./_components/mobile-bottom-nav";

const PUBLIC_PATHS = ["/mobile/login"];
const NAV_VISIBLE_PATHS = ["/mobile/checkin", "/mobile/checkin/meal", "/mobile/history"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { auth, ready } = useMobileAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!auth && !isPublicPath) {
      router.replace("/mobile/login");
    } else if (auth?.mustChangePassword && pathname !== "/mobile/change-password" && !isPublicPath) {
      // Password sementara/default -- WAJIB ganti dulu sebelum bisa pakai fitur lain
      // (padanan mattendance/views.py::mobile_password_needs_change).
      router.replace("/mobile/change-password");
    } else if (auth && isPublicPath) {
      router.replace("/mobile/checkin");
    }
  }, [ready, auth, isPublicPath, pathname, router]);

  // Selagi baru baca localStorage, ATAU baru ketahuan perlu redirect --
  // tampilkan loading, JANGAN sempat render konten halaman yg salah
  // (kedip sebentar sebelum redirect).
  if (!ready || (!auth && !isPublicPath) || (auth && isPublicPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileAuthProvider>
      <MobileShell>{children}</MobileShell>
    </MobileAuthProvider>
  );
}

function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = NAV_VISIBLE_PATHS.includes(pathname);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <div className="flex-1 pb-2">
        <AuthGate>{children}</AuthGate>
      </div>
      {showNav && <MobileBottomNav />}
    </div>
  );
}
