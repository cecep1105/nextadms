"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { DjangoApiUser } from "@/types/api";

export default function ProfilePage() {
  const { update: updateSession } = useSession();
  const { request, session } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<DjangoApiUser | null>(null);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone_number: "", department: "", title: "" });

  useEffect(() => {
    // Sama seperti bug di use-device-function-choices.ts: HARUS tunggu
    // accessToken tersedia dulu, jangan fetch begitu komponen mount
    // (session NextAuth bisa saja masih 'loading' saat itu, request
    // terkirim tanpa header Authorization -> 401).
    if (!session?.accessToken) return;
    setLoading(true);
    request<DjangoApiUser>("/me/")
      .then((data) => {
        setUser(data);
        setForm({
          email: data.email, first_name: data.first_name, last_name: data.last_name,
          phone_number: data.phone_number ?? "", department: data.department ?? "", title: data.title ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await request<DjangoApiUser>("/me/", { method: "PATCH", body: JSON.stringify(form) });
      setUser(updated);
      setSuccess(true);
      await updateSession(updated);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Profil Saya"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/password"><KeyRound className="h-3.5 w-3.5" /> Ganti Password</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{user?.username}</span>
            <Badge variant={user?.auth_source === "ldap" ? "default" : "secondary"}>{user?.auth_source}</Badge>
            {user?.is_staff && <Badge variant="default">Staff</Badge>}
            {user?.is_superuser && <Badge variant="warning">Superuser</Badge>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {success && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Profil berhasil disimpan.</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nama Depan</Label>
                <Input id="first_name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Nama Belakang</Label>
                <Input id="last_name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telepon</Label>
                <Input id="phone" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Departemen</Label>
                <Input id="department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Jabatan</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
