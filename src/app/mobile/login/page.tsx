"use client";
import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMobileAuth } from "@/lib/mobile-auth-context";

export default function MobileLoginPage() {
  const { login } = useMobileAuth();
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(pin, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message ?? "PIN atau password salah.");
    }
    // Sukses -- redirect ditangani AuthGate (layout.tsx), bukan di sini.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <Fingerprint className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Absensi Mobile</h1>
        <p className="text-xs text-muted-foreground">Masuk pakai PIN karyawan Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin" inputMode="numeric" autoFocus value={pin}
            onChange={(e) => setPin(e.target.value)} required className="text-center font-mono text-lg tracking-widest"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Masuk
        </Button>
      </form>
    </div>
  );
}
