"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient, ApiError } from "@/lib/api-client";
import type { Employee, Department } from "@/types/api";

const GENDER_OPTIONS = [
  { value: "M", label: "Laki-laki" },
  { value: "F", label: "Perempuan" },
];
const PRIVILEGE_OPTIONS = [
  { value: "0", label: "Normal" },
  { value: "2", label: "Registrar" },
  { value: "6", label: "Administrator" },
  { value: "14", label: "Supervisor" },
];

const emptyForm = {
  PIN: "", EName: "", DeptID: "", Gender: "", Title: "", Card: "",
  Privilege: "0", Tele: "", Mobile: "", Password: "",
};

export function EmployeeFormDialog({
  mode, employee, departments,
}: {
  mode: "create" | "edit";
  employee?: Employee;
  departments: Department[];
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && employee) {
      setForm({
        PIN: employee.PIN, EName: employee.EName ?? "", DeptID: employee.DeptID ? String(employee.DeptID) : "",
        Gender: employee.Gender ?? "", Title: employee.Title ?? "", Card: employee.Card ?? "",
        Privilege: employee.Privilege !== null ? String(employee.Privilege) : "0",
        Tele: employee.Tele ?? "", Mobile: employee.Mobile ?? "", Password: "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload: Record<string, unknown> = {
      ...form,
      DeptID: form.DeptID ? Number(form.DeptID) : null,
      Privilege: form.Privilege ? Number(form.Privilege) : null,
    };
    if (!payload.Password) delete payload.Password; // jangan timpa password kalau dikosongkan saat edit
    try {
      if (mode === "create") {
        await request("/iclock/device-user/", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await request(`/iclock/device-user/${employee!.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[]> | null;
        setError(body ? Object.values(body).flat().join(" ") : "Gagal menyimpan employee.");
      } else {
        setError("Gagal menyimpan employee.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Tambah Employee
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Employee" : `Edit Employee — ${employee?.PIN}`}</DialogTitle>
          <DialogDescription>Data karyawan/pengguna yang terdaftar di mesin fingerprint.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" value={form.PIN} disabled={mode === "edit"} required className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, PIN: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ename">Nama</Label>
              <Input id="ename" value={form.EName}
                onChange={(e) => setForm((f) => ({ ...f, EName: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pool</Label>
              <Select value={form.DeptID} onValueChange={(v) => setForm((f) => ({ ...f, DeptID: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.DeptID} value={String(d.DeptID)}>{d.DeptName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Privilege</Label>
              <Select value={form.Privilege} onValueChange={(v) => setForm((f) => ({ ...f, Privilege: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIVILEGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.Gender} onValueChange={(v) => setForm((f) => ({ ...f, Gender: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih gender" /></SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.Title}
                onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tele">Telepon Kantor</Label>
              <Input id="tele" value={form.Tele}
                onChange={(e) => setForm((f) => ({ ...f, Tele: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" value={form.Mobile}
                onChange={(e) => setForm((f) => ({ ...f, Mobile: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card">Card ID</Label>
            <Input id="card" value={form.Card} className="font-mono"
              onChange={(e) => setForm((f) => ({ ...f, Card: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password Mesin {mode === "edit" && <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span>}</Label>
            <Input id="password" value={form.Password}
              onChange={(e) => setForm((f) => ({ ...f, Password: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
