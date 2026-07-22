"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Kalau refresh token JUGA sudah invalid (>7 hari, lihat lib/auth.ts),
 * paksa logout & balik ke /login.
 *
 * DUA pengaman tambahan supaya TIDAK jadi loop signout berulang (lihat
 * catatan di middleware.ts -- ini fix SISI LAIN dari masalah yang sama):
 * 1. `firedRef` -- signOut() cuma dipanggil SEKALI per instance komponen
 *    ini, TIDAK setiap kali effect ini re-trigger (bisa terjadi kalau
 *    `session.error` "menyala" berkali-kali dari beberapa refresh attempt
 *    yang gagal berturut-turut sebelum cookie benar2 ke-clear).
 * 2. Skip total kalau SUDAH di /login -- middleware SUDAH menangani
 *    redirect ke /login utk session error (lihat middleware.ts), tidak
 *    perlu signOut() lagi di sini yang cuma nambah 1 request percuma
 *    (POST /api/auth/signout) tiap kali halaman /login ini di-render.
 */
function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const firedRef = useRef(false);

  useEffect(() => {
    if (session?.error === "RefreshTokenError" && pathname !== "/login" && !firedRef.current) {
      firedRef.current = true;
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.error, pathname]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <TooltipProvider delayDuration={200}>
          <SessionErrorHandler>{children}</SessionErrorHandler>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
