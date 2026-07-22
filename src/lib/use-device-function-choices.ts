"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";

export interface DeviceFunctionChoice {
  value: string;
  label: string;
}

/** Ambil daftar Function code (settings.DEVICEFUNCTION Django) utk isi dropdown -- lihat iclock/api_views.py::DeviceFunctionChoicesAPIView. */
export function useDeviceFunctionChoices() {
  const { request, session } = useApiClient();
  const [choices, setChoices] = useState<DeviceFunctionChoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PENTING: tunggu sampai session NextAuth SELESAI di-load (accessToken
    // tersedia) sebelum fetch -- SEBELUMNYA effect ini pakai dependency
    // array KOSONG ([]), jadi langsung fetch begitu komponen mount, TANPA
    // peduli session sudah siap atau belum. Given DeviceFormDialog (pemakai
    // hook ini) me-render utk SETIAP baris device begitu halaman Active
    // Device dibuka (bukan cuma saat dialog-nya dibuka), request pertama
    // SERING terjadi SAAT session masih 'loading' (accessToken masih
    // undefined) -- hasilnya request terkirim TANPA header Authorization,
    // Django balas 401. Sekarang effect ini re-run begitu accessToken
    // berubah dari undefined -> ada isinya, baru fetch beneran jalan.
    if (!session?.accessToken) return;
    request<{ choices: DeviceFunctionChoice[] }>("/iclock/device-function-choices/")
      .then((data) => setChoices(data.choices))
      .catch(() => setChoices([]))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  return { choices, loading };
}
