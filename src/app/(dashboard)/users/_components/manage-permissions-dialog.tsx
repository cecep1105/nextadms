"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { FeaturePermissionsResponse } from "@/types/api";

/**
 * "Kelola Izin" -- beri/cabut izin fitur terbatas (Transfer Data
 * Finger, Rekap Absensi All/Kantin/Driver) ke user NON-STAFF tertentu,
 * TANPA perlu jadikan mereka staff/admin penuh. Padanan Next.js dari
 * halaman Django "Kelola Izin User" (dashboard/views.py::
 * user_manage_permissions) -- KEDUANYA pakai sumber logic SAMA
 * (accounts/services.py::FEATURE_PERMISSIONS/set_feature_permissions),
 * jadi hasilnya selalu konsisten dari mana pun diubah.
 *
 * HANYA relevan utk user non-staff -- staff/superuser otomatis punya
 * akses ke SEMUA fitur (lihat catatan di has_perm() checks backend),
 * pengaturan di sini baru akan berpengaruh kalau status staff-nya
 * diturunkan jadi user biasa.
 */
export function ManagePermissionsDialog({ userId, username, isStaff }: { userId: number; username: string; isStaff: boolean }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<FeaturePermissionsResponse["permissions"]>([]);

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    setError(null);
    request<FeaturePermissionsResponse>(`/users/${userId}/feature-permissions/`)
      .then((data) => setPermissions(data.permissions))
      .catch((err) => setError(extractErrorMessage(err, "Gagal mengambil data izin.")))
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(codename: string) {
    setPermissions((prev) => prev.map((p) => (p.codename === codename ? { ...p, granted: !p.granted } : p)));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const granted = permissions.filter((p) => p.granted).map((p) => p.codename);
      await request(`/users/${userId}/manage-permissions/`, {
        method: "POST",
        body: JSON.stringify({ permissions: granted }),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan izin."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Kelola Izin">
        <ShieldCheck className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kelola Izin: {username}</DialogTitle>
            <DialogDescription>Centang fitur yang boleh diakses user ini tanpa perlu jadi staff/admin penuh.</DialogDescription>
          </DialogHeader>

          {isStaff && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              ⚠️ User ini sudah staff/admin, jadi otomatis punya akses ke SEMUA fitur -- pengaturan di bawah ini baru akan berpengaruh kalau status staff-nya diturunkan jadi user biasa.
            </div>
          )}
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

          {fetching ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {permissions.map((p) => (
                <label key={p.codename} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={p.granted} onCheckedChange={() => toggle(p.codename)} />
                  <Label className="cursor-pointer font-normal">{p.label}</Label>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={loading || fetching}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
