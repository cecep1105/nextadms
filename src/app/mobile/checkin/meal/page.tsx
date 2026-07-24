"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Utensils } from "lucide-react";
import { useMobileAuth, MobileApiError } from "@/lib/mobile-auth-context";
import { StatusOverlay, type StatusKind } from "../../_components/status-overlay";

export default function MobileCheckinMealPage() {
  const { request } = useMobileAuth();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const submittingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [qrHint, setQrHint] = useState("Mengaktifkan kamera...");
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({ kind: null, message: "" });

  function stopCamera() {
    scanningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function tick() {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code?.data && !submittingRef.current) {
          setQrHint(`QR terdeteksi: ${code.data}`);
          handleQrDetected(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: "error", message: "Browser Anda tidak mendukung akses kamera." });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        scanningRef.current = true;
        setQrHint("Mencari QR code...");
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch((err: Error) => setStatus({ kind: "error", message: `Gagal mengakses kamera: ${err.message}` }));

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resumeScanning() {
    setTimeout(() => {
      submittingRef.current = false;
      scanningRef.current = true;
      setQrHint("Mencari QR code...");
      rafRef.current = requestAnimationFrame(tick);
    }, 3000);
  }

  function handleQrDetected(qrContent: string) {
    submittingRef.current = true;
    scanningRef.current = false;

    if (!navigator.geolocation) {
      setStatus({ kind: "error", message: "Browser Anda tidak mendukung layanan lokasi." });
      resumeScanning();
      return;
    }
    setStatus({ kind: "info", message: "QR terdeteksi, mengambil lokasi..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await request<{ detail: string }>("/mattendance/checkin/meal/", {
            method: "POST",
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              qr_content: qrContent,
            }),
          });
          setStatus({ kind: "success", message: result.detail });
          stopCamera();
          setTimeout(() => router.push("/mobile/history"), 1200);
        } catch (err) {
          if (err instanceof MobileApiError) {
            const body = err.body as { message?: string } | null;
            setStatus({ kind: "error", message: body?.message ?? "Gagal absen makan." });
          } else {
            setStatus({ kind: "error", message: "Gagal menghubungi server." });
          }
          resumeScanning();
        }
      },
      (error) => {
        setStatus({ kind: "error", message: `Gagal mengambil lokasi: ${error.message}` });
        resumeScanning();
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-3 font-display text-base font-semibold tracking-tight">Absen Makan (Check/Meal)</h1>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: "1/1" }}>
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-3xl border-4 border-emerald-400 opacity-80" />
          </div>
          <StatusOverlay kind={status.kind} message={status.message} />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="mt-3 text-center text-xs text-muted-foreground">{qrHint}</p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
        <Utensils className="h-4 w-4 shrink-0" />
        <p>Arahkan kamera ke QR code di kantin untuk absen makan siang.</p>
      </div>
    </div>
  );
}
