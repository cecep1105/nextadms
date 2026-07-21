"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Kalau refresh token JUGA sudah invalid (>7 hari, lihat lib/auth.ts), paksa logout & balik ke /login. */
function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);
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
