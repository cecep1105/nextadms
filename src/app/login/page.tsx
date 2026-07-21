"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Fingerprint, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Username atau password salah.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Sisi kiri -- signature "scan pulse", cuma tampil di layar lebar (mobile fokus ke form) */}
      <div className="relative hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Fingerprint className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">CCPADMS</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center">
            <span className="scan-ring" style={{ animationDelay: "0s" }} />
            <span className="scan-ring" style={{ animationDelay: "0.7s" }} />
            <span className="scan-ring" style={{ animationDelay: "1.4s" }} />
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Fingerprint className="h-10 w-10 text-primary" strokeWidth={1.25} />
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground">
            Satu konsol untuk seluruh infrastruktur absensi.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Device fingerprint, employee, transaksi, dan mobile attendance — termonitor real-time
            dalam satu tempat.
          </p>
        </div>
      </div>

      {/* Sisi kanan -- form login */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Fingerprint className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-sm font-semibold tracking-tight">CCPADMS</span>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Masuk ke konsol</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pakai akun staff yang sudah terdaftar di sistem.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Masuk <ArrowRight className="h-3.5 w-3.5" /></>}
            </Button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} CCPADMS — Attendance & Device Console
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
