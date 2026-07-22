import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { DjangoUser } from "@/types/next-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

/**
 * Base `JWT` (dari @auth/core) extends `Record<string, unknown>`, yang
 * bikin declaration merging via next-auth.d.ts TIDAK selalu ke-resolve
 * dgn tipe yang benar (property jadi 'unknown') -- jadi definisikan tipe
 * EKSPLISIT di sini & cast `token` ke tipe ini di awal callback, bukan
 * bergantung penuh ke ambient module augmentation.
 */
type AppJWT = JWT & {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  user: DjangoUser;
  error?: "RefreshTokenError";
};

/** Sama seperti AppJWT -- Session base type juga rewel soal declaration merging, jadi cast eksplisit di sini juga. */
type AppSession = Omit<Session, "user"> & {
  accessToken: string;
  error?: "RefreshTokenError";
  user: DjangoUser;
};

/** Baca klaim `exp` dari JWT (base64 payload) TANPA perlu library JWT penuh -- cukup utk tahu kapan access token kadaluarsa. */
function decodeJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return (payload.exp as number) * 1000;
  } catch {
    return Date.now() + 25 * 60 * 1000; // fallback konservatif (lebih pendek dari 30 menit asli) kalau decode gagal
  }
}

/**
 * Refresh access token via /api/v1/auth/refresh/ -- Django pakai
 * ROTATE_REFRESH_TOKENS=True (lihat config/settings.py::SIMPLE_JWT), jadi
 * refresh token LAMA otomatis di-blacklist & yang BARU wajib disimpan
 * ulang (bukan reuse refresh token yang sama terus-menerus).
 */
async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    throw new Error("RefreshFailed");
  }
  const data = await res.json();
  return {
    accessToken: data.access as string,
    refreshToken: (data.refresh as string) ?? refreshToken,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_BASE_URL}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials?.username,
            password: credentials?.password,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const user: import("next-auth").User = {
          ...data.user,
          id: String(data.user.id), // NextAuth mensyaratkan id:string -- dikonversi balik ke number di jwt() callback
          accessToken: data.access,
          refreshToken: data.refresh,
          accessTokenExpires: decodeJwtExpiry(data.access),
        };
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const t = token as AppJWT;

      // Login pertama -- `user` cuma ada di request INI (dari authorize()).
      if (user) {
        t.accessToken = user.accessToken;
        t.refreshToken = user.refreshToken;
        t.accessTokenExpires = user.accessTokenExpires;
        const { accessToken: _a, refreshToken: _r, accessTokenExpires: _e, ...rest } = user;
        t.user = { ...rest, id: Number(user.id) } as DjangoUser;
        return t;
      }

      // Client panggil `update(data)` (mis. setelah edit profil di /profile)
      // -- `session` di sini adalah `data` yang dikirim, BUKAN session penuh.
      // Timpa field yang dikirim ke token.user supaya topbar dkk langsung
      // lihat data terbaru TANPA perlu re-login/nunggu access token expire.
      if (trigger === "update" && session) {
        t.user = { ...t.user, ...session } as DjangoUser;
        return t;
      }

      // Access token MASIH berlaku (kasih jeda 60 detik sblm expiry beneran, hindari race condition request yg lagi jalan).
      if (Date.now() < t.accessTokenExpires - 60_000) {
        return t;
      }

      // Access token kadaluarsa/mau kadaluarsa -- coba refresh.
      try {
        const refreshed = await refreshAccessToken(t.refreshToken);
        t.accessToken = refreshed.accessToken;
        t.refreshToken = refreshed.refreshToken;
        t.accessTokenExpires = decodeJwtExpiry(refreshed.accessToken);
        delete t.error;
        return t;
      } catch {
        // Refresh token JUGA sudah invalid/expired (>7 hari) -- tandai error,
        // komponen client akan redirect ke /login (lihat SessionErrorHandler).
        t.error = "RefreshTokenError";
        return t;
      }
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      const s = session as AppSession;
      s.accessToken = t.accessToken;
      s.user = t.user;
      s.error = t.error;
      return s;
    },
  },
});