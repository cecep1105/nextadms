import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  // PENTING: token BISA "ada" (`req.auth` truthy) TAPI rusak (refresh
  // token sudah invalid/expired, ditandai `error: "RefreshTokenError"` --
  // lihat lib/auth.ts). SEBELUMNYA middleware cuma cek `!!req.auth`, jadi
  // token rusak TETAP dianggap "logged in" di sini -- lolos ke halaman
  // dashboard, TAPI SessionErrorHandler (client-side, providers.tsx)
  // langsung signOut() begitu lihat error itu -> balik ke /login -> token
  // rusak yg SAMA (belum sempat ke-clear penuh) bikin middleware LOLOSKAN
  // lagi -> signOut lagi -> LOOP. Sekarang middleware treat error state
  // sbg TIDAK logged in, redirect ke /login LANGSUNG di sini -- tidak
  // perlu round-trip lewat client-side signOut lagi.
  const isLoggedIn = !!req.auth && !req.auth.error;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Semua path KECUALI asset statis, gambar, & endpoint NextAuth sendiri.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
