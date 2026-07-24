"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, LogOut as LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileAuth, MobileApiError } from "@/lib/mobile-auth-context";
import { StatusOverlay, type StatusKind } from "../_components/status-overlay";

export default function MobileCheckinPage() {
  const { request } = useMobileAuth();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasFaceProfile, setHasFaceProfile] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({ kind: null, message: "" });

  useEffect(() => {
    request<{ has_face_profile: boolean }>("/mattendance/face/status/")
      .then((data) => setHasFaceProfile(data.has_face_profile))
      .catch(() => setHasFaceProfile(false));
  }, [request]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: "error", message: "Browser Anda tidak mendukung akses kamera." });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      })
      .catch((err: Error) => setStatus({ kind: "error", message: `Gagal mengakses kamera: ${err.message}` }));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function captureFaceImage(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  function doCheck(checkType: "IN" | "OUT") {
    if (!hasFaceProfile) {
      setStatus({ kind: "error", message: "Anda belum mendaftarkan wajah -- daftar dulu sebelum absen." });
      return;
    }
    if (!navigator.geolocation) {
      setStatus({ kind: "error", message: "Browser Anda tidak mendukung layanan lokasi." });
      return;
    }
    const faceImage = captureFaceImage();
    if (!faceImage) {
      setStatus({ kind: "error", message: "Kamera belum siap, coba lagi sebentar." });
      return;
    }

    setSubmitting(true);
    setStatus({ kind: "info", message: "Memverifikasi lokasi & wajah..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await request<{ detail: string }>("/mattendance/checkin/", {
            method: "POST",
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              check_type: checkType,
              face_image: faceImage,
            }),
          });
          setStatus({ kind: "success", message: result.detail });
          stopCamera();
          setTimeout(() => router.push("/mobile/history"), 1200);
        } catch (err) {
          if (err instanceof MobileApiError) {
            const body = err.body as { message?: string; code?: string } | null;
            setStatus({ kind: "error", message: body?.message ?? "Gagal melakukan absen." });
            if (body?.code === "needs_enrollment") {
              setTimeout(() => router.push("/mobile/face-enroll"), 2000);
            }
          } else {
            setStatus({ kind: "error", message: "Gagal menghubungi server." });
          }
          setSubmitting(false);
        }
      },
      (error) => {
        setStatus({ kind: "error", message: `Gagal mengambil lokasi: ${error.message}` });
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const buttonsDisabled = submitting || !hasFaceProfile;

  return (
    <div className="p-4">
      <h1 className="mb-3 font-display text-base font-semibold tracking-tight">Absen Masuk / Keluar</h1>

      {hasFaceProfile === false && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <span className="shrink-0">⚠️</span>
          <span>
            Anda belum mendaftarkan wajah.{" "}
            <a href="/mobile/face-enroll" className="font-semibold underline">Daftar wajah dulu di sini</a> sebelum bisa absen.
          </span>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        {/* Container relative -- StatusOverlay absolute DI DALAM sini, jadi
            muncul/hilangnya TIDAK PERNAH mendorong kamera/tombol di bawahnya. */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: "3/4" }}>
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-40 rounded-[50%] border-4 border-white/40" />
          </div>
          <StatusOverlay kind={status.kind} message={status.message} />
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {/* Tombol SELALU dirender di posisi ini -- cuma disabled/enabled,
            TIDAK PERNAH disembunyikan/dipindah -- jadi selalu terlihat di
            tempat yang sama persis, terlepas dari status di atas. */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            size="lg" disabled={buttonsDisabled} onClick={() => doCheck("IN")}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <CheckCircle className="h-4 w-4" /> Check-in
          </Button>
          <Button
            size="lg" disabled={buttonsDisabled} onClick={() => doCheck("OUT")}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <LogOutIcon className="h-4 w-4" /> Check-out
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {cameraReady ? "Posisikan wajah Anda di dalam bingkai" : "Mengaktifkan kamera..."}
        </p>
      </div>
    </div>
  );
}
