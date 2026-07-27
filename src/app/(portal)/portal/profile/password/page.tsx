"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export default function PortalChangePasswordPage() {
  const { request } = useApiClient();
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (form.new_password !== form.confirm_password) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await request("/me/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }),
      });
      setSuccess(true);
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <PageHeader
        title="Ganti Password"
        description={
          <Link href="/portal/profile" className="text-primary hover:underline">
            ← Kembali ke Profil Saya
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Password Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {success && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Password berhasil diubah.</div>}

            <div className="space-y-1.5">
              <Label htmlFor="old_password">Password Saat Ini</Label>
              <Input id="old_password" type="password" required value={form.old_password}
                onChange={(e) => setForm((f) => ({ ...f, old_password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Password Baru</Label>
              <Input id="new_password" type="password" required value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <Input id="confirm_password" type="password" required value={form.confirm_password}
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Ubah Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
