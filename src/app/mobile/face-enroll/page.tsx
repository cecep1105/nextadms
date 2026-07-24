"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileAuth, MobileApiError } from "@/lib/mobile-auth-context";
import { StatusOverlay, type StatusKind } from "../_components/status-overlay";

export default function MobileFaceEnrollPage() {
  const { request } = useMobileAuth();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({ kind: null, message: "" });

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: "error", message: "Browser Anda tidak mendukung akses kamera." });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err: Error) => setStatus({ kind: "error", message: `Gagal mengakses kamera: ${err.message}` }));

    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function handleEnroll() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      setStatus({ kind: "error", message: "Kamera belum siap, coba lagi sebentar." });
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const faceImage = canvas.toDataURL("image/jpeg", 0.9);

    setSubmitting(true);
    setStatus({ kind: "info", message: "Memproses wajah..." });
    try {
      const result = await request<{ detail: string }>("/mattendance/face/enroll/", {
        method: "POST",
        body: JSON.stringify({ face_image: faceImage }),
      });
      setStatus({ kind: "success", message: result.detail });
      stopCamera();
      setTimeout(() => router.push("/mobile/checkin"), 1500);
    } catch (err) {
      if (err instanceof MobileApiError) {
        const body = err.body as { message?: string } | null;
        setStatus({ kind: "error", message: body?.message ?? "Gagal mendaftarkan wajah." });
      } else {
        setStatus({ kind: "error", message: "Gagal menghubungi server." });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-1 font-display text-base font-semibold tracking-tight">Daftar Wajah</h1>
      <p className="mb-3 text-xs text-muted-foreground">
        Pendaftaran ini HANYA BISA DILAKUKAN SEKALI -- pastikan pencahayaan cukup & wajah terlihat jelas.
      </p>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: "3/4" }}>
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-40 rounded-[50%] border-4 border-white/40" />
          </div>
          <StatusOverlay kind={status.kind} message={status.message} />
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <Button size="lg" className="mt-3 w-full" disabled={submitting} onClick={handleEnroll}>
          <ScanFace className="h-4 w-4" /> Daftarkan Wajah Saya
        </Button>
      </div>
    </div>
  );
}
