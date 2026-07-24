"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMobileAuth, MobileApiError } from "@/lib/mobile-auth-context";

export default function MobileChangePasswordPage() {
  const { request, auth, logout } = useMobileAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await request("/mattendance/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
      });
      // Password berubah -- login ulang supaya flag must_change_password
      // di sesi lokal ke-refresh (server sudah tahu, tapi state lokal
      // kita masih nyimpan flag lama) -- paksa balik ke login demi bersih.
      logout();
      router.replace("/mobile/login");
    } catch (err) {
      if (err instanceof MobileApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? "Gagal mengubah password.");
      } else {
        setError("Gagal mengubah password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15">
          <KeyRound className="h-7 w-7 text-warning" />
        </div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Ganti Password</h1>
        <p className="max-w-xs text-xs text-muted-foreground">
          Halo {auth?.displayName} -- ini login pertama Anda, wajib ganti password default dulu sebelum bisa absen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="new_password">Password Baru</Label>
          <Input id="new_password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
          <Input id="confirm_password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Simpan & Masuk Ulang
        </Button>
      </form>
    </div>
  );
}
