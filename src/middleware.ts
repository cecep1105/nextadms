import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Path yang boleh diakses SIAPA SAJA yang sudah login (staff maupun non-staff)
// -- portal khusus non-staff (card button, BUKAN sidebar dashboard admin).
// Staff BOLEH juga buka ini manual kalau mau, tapi tidak di-redirect ke sini.
const PORTAL_PREFIX = "/portal";

export default auth((req) => {
  // PENTING: token BISA "ada" (`req.auth` truthy) TAPI rusak (refresh
  // token sudah invalid/expired, ditandai `error: "RefreshTokenError"` --
  // lihat lib/auth.ts). Middleware treat error state sbg TIDAK logged in,
  // redirect ke /login LANGSUNG di sini -- lihat catatan lengkap di
  // providers.tsx::SessionErrorHandler soal kenapa ini penting (hindari
  // loop signout).
  const isLoggedIn = !!req.auth && !req.auth.error;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isStaff = req.auth?.user?.is_staff || req.auth?.user?.is_superuser;
  const isPortalPath = req.nextUrl.pathname === PORTAL_PREFIX || req.nextUrl.pathname.startsWith(`${PORTAL_PREFIX}/`);

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    // User non-staff tidak punya dashboard admin utk dilihat -- langsung
    // ke Portal (card button), BUKAN ke "/" yg isinya stat cards Active
    // Device dkk yang dia toh tidak berhak lihat.
    return NextResponse.redirect(new URL(isStaff ? "/" : PORTAL_PREFIX, req.url));
  }

  // Akun BUKAN staff/superuser coba akses halaman dashboard admin (Active
  // Device, Employee, Manajemen User, dst) -- block DI SINI, jangan
  // biarkan sampai ke halaman & baru gagal per-API-call. Portal (+
  // sub-halamannya) TETAP boleh -- akses granular per-fitur (Transfer
  // Finger/Attendance Recap) diatur backend (HasFeaturePermission), bukan
  // di middleware ini.
  if (isLoggedIn && !isStaff && !isPortalPath) {
    return NextResponse.redirect(new URL(PORTAL_PREFIX, req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Semua path KECUALI: asset statis, gambar, endpoint NextAuth sendiri,
  // DAN seluruh "/mobile" -- itu punya sistem auth SENDIRI (PIN + JWT
  // tersimpan di localStorage, lib/mobile-auth-context.tsx), TIDAK lewat
  // NextAuth/session sama sekali. Middleware ini (server-side) tidak bisa
  // baca localStorage (browser-only), jadi kalau /mobile TIDAK dikecualikan
  // di sini, auth() akan selalu anggap user mobile "belum login" (tidak
  // ada sesi NextAuth) & paksa redirect ke /login (halaman staff) --
  // pengecekan login utk /mobile sepenuhnya ditangani client-side lewat
  // MobileAuthProvider (lihat src/app/mobile/layout.tsx).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|mobile).*)"],
};
