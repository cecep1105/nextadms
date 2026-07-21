"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient, ApiError } from "@/lib/api-client";
import type { Department } from "@/types/api";

const emptyForm = { DeptID: "", DeptName: "", NetID: "0", DeptRouter: "", DeptSubnet: "" };

export function DepartmentFormDialog({ mode, department }: { mode: "create" | "edit"; department?: Department }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && department) {
      setForm({
        DeptID: String(department.DeptID), DeptName: department.DeptName,
        NetID: String(department.NetID), DeptRouter: department.DeptRouter, DeptSubnet: department.DeptSubnet,
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
    const payload = { ...form, DeptID: Number(form.DeptID), NetID: Number(form.NetID) };
    try {
      if (mode === "create") {
        await request("/iclock/department/", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await request(`/iclock/department/${department!.DeptID}/`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[]> | null;
        setError(body ? Object.values(body).flat().join(" ") : "Gagal menyimpan pool.");
      } else {
        setError("Gagal menyimpan pool.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Tambah Pool</Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Pool" : `Edit Pool — ${department?.DeptName}`}</DialogTitle>
          <DialogDescription>Pool/department dipakai sbg pengelompokan device & employee.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deptid">Pool ID</Label>
              <Input id="deptid" type="number" value={form.DeptID} disabled={mode === "edit"} required
                onChange={(e) => setForm((f) => ({ ...f, DeptID: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deptname">Nama Pool</Label>
              <Input id="deptname" value={form.DeptName} required
                onChange={(e) => setForm((f) => ({ ...f, DeptName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="netid">Net ID</Label>
            <Input id="netid" type="number" value={form.NetID}
              onChange={(e) => setForm((f) => ({ ...f, NetID: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="router">Router</Label>
              <Input id="router" value={form.DeptRouter} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, DeptRouter: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subnet">Subnet</Label>
              <Input id="subnet" value={form.DeptSubnet} className="font-mono"
                onChange={(e) => setForm((f) => ({ ...f, DeptSubnet: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
