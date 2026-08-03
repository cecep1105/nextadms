"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Ambil foto LANGSUNG dari webcam (getUserMedia + canvas) -- dipakai di
 * alur Generate Kartu (idcard/generate) sbg alternatif dari cari foto
 * FTP. Hasil akhir SELALU data URI base64 (SAMA format dgn foto FTP,
 * lihat idcard/photo_utils.py) -- API generate-kartu backend cuma py
 * 1 jalur decode utk KETIGA sumber foto (ftp/shoot/upload), TIDAK perlu
 * tahu bedanya lagi setelah sampai di sini.
 */
export function WebcamCapture({ onCapture }: { onCapture: (dataUri: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]); // matikan kamera saat komponen dilepas -- JANGAN biarkan lampu kamera tetap menyala di background

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCapturedPreview(null);
    } catch {
      setError("Tidak bisa mengakses kamera -- pastikan browser diizinkan akses kamera, dan tidak ada aplikasi lain yang sedang memakainya.");
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(dataUri);
    onCapture(dataUri);
    stopCamera();
  }

  function handleRetake() {
    setCapturedPreview(null);
    startCamera();
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-secondary/50">
        {capturedPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedPreview} alt="Foto hasil shoot" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${cameraActive ? "" : "hidden"}`} />
        )}
        {!cameraActive && !capturedPreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <VideoOff className="h-8 w-8" />
            <span className="text-xs">Kamera belum aktif</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        {capturedPreview ? (
          <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
            <RefreshCw className="h-3.5 w-3.5" /> Ambil Ulang
          </Button>
        ) : cameraActive ? (
          <Button type="button" size="sm" onClick={handleCapture}>
            <Camera className="h-3.5 w-3.5" /> Jepret
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startCamera}>
            <Video className="h-3.5 w-3.5" /> Aktifkan Kamera
          </Button>
        )}
      </div>
    </div>
  );
}
