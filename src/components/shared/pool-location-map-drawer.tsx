"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useApiClient, ApiError } from "@/lib/api-client";

declare global {
  interface Window {
    google: typeof google;
    initPoolLocMap?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const JAKARTA_CENTER = { lat: -6.2, lng: 106.8166 };

export function PoolLocationMapDrawer({
  poolId: initialPoolId,
  existingPoints,
  knownPoolIds,
}: {
  poolId: string;
  existingPoints: { Latitude: string; Longitude: string }[];
  knownPoolIds: string[];
}) {
  const router = useRouter();
  const { request } = useApiClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const polygonObj = useRef<google.maps.Polygon | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [poolId, setPoolId] = useState(initialPoolId);
  const [pointCount, setPointCount] = useState(0);
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function updatePolygon() {
    if (!polygonObj.current) return;
    const path = markersRef.current.map((m) => m.getPosition()!);
    polygonObj.current.setPath(path);
    setPointCount(markersRef.current.length);
    setPoints(markersRef.current.map((m) => ({ lat: m.getPosition()!.lat(), lng: m.getPosition()!.lng() })));
  }

  function addPoint(lat: number, lng: number) {
    if (!mapObj.current) return;
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapObj.current,
      label: String(markersRef.current.length + 1),
      draggable: true,
    });
    marker.addListener("dragend", updatePolygon);
    markersRef.current.push(marker);
    updatePolygon();
  }

  function initMap() {
    if (!mapRef.current) return;
    const initialCenter = existingPoints.length > 0
      ? { lat: parseFloat(existingPoints[0].Latitude), lng: parseFloat(existingPoints[0].Longitude) }
      : JAKARTA_CENTER;

    const map = new window.google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 18,
      mapTypeId: "satellite",
    });
    mapObj.current = map;

    const polygon = new window.google.maps.Polygon({
      paths: [],
      strokeColor: "#2DD4BF",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#2DD4BF",
      fillOpacity: 0.2,
    });
    polygon.setMap(map);
    polygonObj.current = polygon;

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) addPoint(e.latLng.lat(), e.latLng.lng());
    });

    existingPoints.forEach((p) => addPoint(parseFloat(p.Latitude), parseFloat(p.Longitude)));
    setMapReady(true);
  }

  useEffect(() => {
    if (scriptLoaded) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  function handleUndo() {
    const last = markersRef.current.pop();
    last?.setMap(null);
    markersRef.current.forEach((m, i) => m.setLabel(String(i + 1)));
    updatePolygon();
  }

  function handleClear() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    updatePolygon();
  }

  async function handleSave() {
    setStatus(null);
    if (!poolId.trim()) {
      setStatus({ type: "error", message: "PoolID wajib diisi." });
      return;
    }
    if (points.length < 3) {
      setStatus({ type: "error", message: `Minimal 3 titik untuk jadi polygon valid (sekarang ${points.length}).` });
      return;
    }
    setSaving(true);
    try {
      const result = await request<{ detail: string }>(
        `/mclock/mobile-pool-loc/bulk-save/${encodeURIComponent(poolId.trim())}/`,
        { method: "POST", body: JSON.stringify({ points }) }
      );
      setStatus({ type: "success", message: result.detail });
      setTimeout(() => {
        router.push("/mclock/mobile-pool-locations");
        router.refresh();
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        setStatus({ type: "error", message: body?.detail ?? "Gagal menyimpan polygon." });
      } else {
        setStatus({ type: "error", message: "Gagal menghubungi server." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="border-warning/30 bg-warning/5 p-4 text-sm text-warning">
        ⚠️ <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> belum diisi di <code>.env.local</code> — peta tidak
        bisa dimuat. Buat API key dari Google Cloud Console (aktifkan &quot;Maps JavaScript API&quot;),
        lalu restart <code>npm run dev</code>.
      </Card>
    );
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`}
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="mb-3 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
        🧪 Data ini murni untuk <strong>testing</strong> geofence — akan hilang/tertimpa begitu
        <code className="mx-1">sync_mobile_pool_loc</code> dijalankan lagi. Klik di peta untuk tambah titik
        (urutan klik = urutan keliling polygon), minimal 3 titik. Menyimpan akan{" "}
        <strong>mengganti seluruh titik lama</strong> milik PoolID ini.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={mapRef} className="h-[520px] w-full rounded-xl border border-border bg-muted" />
          {!mapReady && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Memuat peta...
            </p>
          )}
        </div>

        <Card className="h-fit space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="poolid">PoolID</Label>
            <Input
              id="poolid"
              list="poolid-list"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              placeholder="mis. TEST1 — sama dengan PoolID di Mobile Pool"
              className="font-mono"
            />
            <datalist id="poolid-list">
              {knownPoolIds.map((id) => <option key={id} value={id} />)}
            </datalist>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Titik Polygon ({pointCount})
            </p>
            <ol className="max-h-40 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted-foreground">
              {points.map((p, i) => (
                <li key={i}>#{i + 1}: {p.lat.toFixed(6)}, {p.lng.toFixed(6)}</li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleUndo} disabled={!mapReady}>
              Hapus Terakhir
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleClear} disabled={!mapReady}>
              Hapus Semua
            </Button>
          </div>

          {status && (
            <div className={`rounded-md px-3 py-2 text-xs ${status.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {status.message}
            </div>
          )}

          <Button className="w-full" onClick={handleSave} disabled={saving || !mapReady}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan Polygon
          </Button>
        </Card>
      </div>
    </>
  );
}
