"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";

export interface DeviceFunctionChoice {
  value: string;
  label: string;
}

/** Ambil daftar Function code (settings.DEVICEFUNCTION Django) utk isi dropdown -- lihat iclock/api_views.py::DeviceFunctionChoicesAPIView. */
export function useDeviceFunctionChoices() {
  const { request } = useApiClient();
  const [choices, setChoices] = useState<DeviceFunctionChoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<{ choices: DeviceFunctionChoice[] }>("/iclock/device-function-choices/")
      .then((data) => setChoices(data.choices))
      .catch(() => setChoices([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { choices, loading };
}
