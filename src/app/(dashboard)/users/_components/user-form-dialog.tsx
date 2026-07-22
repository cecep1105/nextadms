"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { DjangoApiUser } from "@/types/api";

export function UserFormDialog({ mode, user }: { mode: "create" | "edit"; user?: DjangoApiUser }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "", email: "", first_name: "", last_name: "",
    phone_number: "", department: "", title: "", password: "", is_staff: false,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && user) {
      setForm({
        username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name,
        phone_number: user.phone_number ?? "", department: user.department ?? "", title: user.title ?? "",
        password: "", is_staff: user.is_staff,
      });
    } else {
      setForm({ username: "", email: "", first_name: "", last_name: "", phone_number: "", department: "", title: "", password: "", is_staff: false });
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "create") {
        await request("/users/", {
          method: "POST",
          body: JSON.stringify({
            username: form.username, email: form.email, first_name: form.first_name,
            last_name: form.last_name, password: form.password, is_staff: form.is_staff,
          }),
        });
      } else {
        await request(`/users/${user!.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            email: form.email, first_name: form.first_name, last_name: form.last_name,
            phone_number: form.phone_number, department: form.department, title: form.title,
          }),
        });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan user."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah User</Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      )}
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah User Lokal" : `Edit User — ${user?.username}`}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "User baru dibuat sebagai akun lokal (bukan LDAP)."
              : "Username & password tidak bisa diubah di sini -- gunakan aksi Reset Password terpisah."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          {mode === "create" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={form.username} required
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} required
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nama Depan</Label>
              <Input id="first_name" value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nama Belakang</Label>
              <Input id="last_name" value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>

          {mode === "edit" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input id="phone" value={form.phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Departemen</Label>
                  <Input id="department" value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Jabatan</Label>
                <Input id="title" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
            </>
          )}

          {mode === "create" && (
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={form.is_staff} onCheckedChange={(v) => setForm((f) => ({ ...f, is_staff: v }))} />
              Jadikan Staff (akses dashboard admin)
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
