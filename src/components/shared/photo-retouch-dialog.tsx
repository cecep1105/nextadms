"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Move, RotateCcw, Check, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardPhotoBoxConfig } from "@/types/api";

/**
 * Retouch foto (geser posisi/crop) SEBELUM dipakai di ID Card -- Canvas
 * 2D native (BUKAN Wasm/Rust: tugas ini murni transform affine
 * sederhana yg SUDAH dioptimasi habis-habisan oleh Canvas 2D browser).
 * Pola interaksi: FRAME crop UKURAN TETAP (rasio PERSIS SAMA dgn kotak
 * foto sungguhan di kartu, lihat fetchAspectRatio()), user GESER & ZOOM
 * fotonya (bukan geser garis crop) -- lebih sederhana scr matematika
 * (cuma 1 set transform: scale+offset) drpd rectangle crop bebas-resize
 * dgn 8 handle, DAN lebih mirip pola "atur foto profil" yang sudah
 * familiar bagi user awam.
 *
 * PENTING rasio TIDAK di-hardcode di sini -- diambil dari
 * /idcard/photo-box-config/ (server), supaya SELALU cocok dgn kotak
 * foto SUNGGUHAN di kartu (settings.IDCARD_PHOTO_BOX bisa beda per
 * deployment lewat .env) -- kalau di-hardcode & beda, foto BISA
 * ke-crop ULANG scr tidak terduga oleh backend stlh staf susah payah
 * atur posisi di sini.
 */
const FRAME_WIDTH = 280; // px, ukuran TAMPILAN frame crop di dialog (BUKAN resolusi output akhir)

export function PhotoRetouchDialog({
  open, onOpenChange, sourceImage, pin, onRetouched,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceImage: string;
  pin?: string;
  onRetouched: (dataUri: string) => void;
}) {
  const { request } = useApiClient();

  const [frameHeight, setFrameHeight] = useState(FRAME_WIDTH); // disesuaikan begitu rasio server diketahui
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const baseScaleRef = useRef(1); // skala MINIMUM spy foto SELALU menutupi frame penuh (spt CSS object-fit: cover)
  const [zoomMultiplier, setZoomMultiplier] = useState(1); // 1 = base (paling zoom-out yg masih menutupi frame penuh)
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [saveToFtp, setSaveToFtp] = useState(true); // default AKTIF kalau `pin` tersedia -- sesuai tujuan "dipakai ulang tanpa crop ulang"
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const dragStateRef = useRef<{ startX: number; startY: number; originOffsetX: number; originOffsetY: number } | null>(null);

  function clampOffsets(scale: number, w: number, h: number, x: number, y: number): [number, number] {
    const img = imgRef.current;
    const dispW = (img?.naturalWidth ?? 0) * scale;
    const dispH = (img?.naturalHeight ?? 0) * scale;
    const maxX = Math.max(0, (dispW - w) / 2);
    const maxY = Math.max(0, (dispH - h) / 2);
    return [Math.min(maxX, Math.max(-maxX, x)), Math.min(maxY, Math.max(-maxY, y))];
  }

  function draw(scale: number, x: number, y: number) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dispW = img.naturalWidth * scale;
    const dispH = img.naturalHeight * scale;
    const drawX = (FRAME_WIDTH - dispW) / 2 + x;
    const drawY = (frameHeight - dispH) / 2 + y;
    ctx.drawImage(img, drawX, drawY, dispW, dispH);
  }

  async function fetchAspectRatio(): Promise<number> {
    try {
      const cfg = await request<IDCardPhotoBoxConfig>("/idcard/photo-box-config/");
      return FRAME_WIDTH * (cfg.height / cfg.width);
    } catch {
      // gagal ambil config -- fallback rasio 3:4.75 (nilai yg DISEBUTKAN
      // di komentar card_generator.py) drpd persegi buta, MASIH bisa
      // salah kalau server benar2 dikonfigurasi beda, tapi lebih dekat
      // drpd tebakan 1:1.
      return FRAME_WIDTH * (4.75 / 3);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setApplyError(null);
    setSaveToFtp(Boolean(pin));
    setImgLoaded(false);
    setLoadError(null);

    (async () => {
      const newFrameHeight = await fetchAspectRatio();
      if (cancelled) return;
      setFrameHeight(newFrameHeight);

      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        imgRef.current = image;
        const baseScale = Math.max(FRAME_WIDTH / image.naturalWidth, newFrameHeight / image.naturalHeight);
        baseScaleRef.current = baseScale;
        setZoomMultiplier(1);
        setOffsetX(0);
        setOffsetY(0);
        setImgLoaded(true);
      };
      image.onerror = () => { if (!cancelled) setLoadError("Gagal memuat gambar."); };
      image.src = sourceImage;
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!imgLoaded) return;
    const scale = baseScaleRef.current * zoomMultiplier;
    const [x, y] = clampOffsets(scale, FRAME_WIDTH, frameHeight, offsetX, offsetY);
    if (x !== offsetX) setOffsetX(x);
    if (y !== offsetY) setOffsetY(y);
    draw(scale, x, y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded, zoomMultiplier, offsetX, offsetY, frameHeight]);

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!imgLoaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, originOffsetX: offsetX, originOffsetY: offsetY };
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragStateRef.current;
    if (!drag) return;
    setOffsetX(drag.originOffsetX + (e.clientX - drag.startX));
    setOffsetY(drag.originOffsetY + (e.clientY - drag.startY));
  }
  function handlePointerUp() { dragStateRef.current = null; }

  function handleReset() {
    setZoomMultiplier(1);
    setOffsetX(0);
    setOffsetY(0);
  }

  async function handleApply() {
    const img = imgRef.current;
    if (!img) return;
    setApplying(true);
    setApplyError(null);
    try {
      const scale = baseScaleRef.current * zoomMultiplier;
      const dispW = img.naturalWidth * scale;
      const dispH = img.naturalHeight * scale;
      const imgX = (FRAME_WIDTH - dispW) / 2 + offsetX;
      const imgY = (frameHeight - dispH) / 2 + offsetY;

      // Konversi area frame (koordinat TAMPILAN) balik ke koordinat PIXEL
      // ASLI gambar (bagi dgn scale) -- ini yg akan di-`drawImage` sbg
      // source rectangle.
      const sx = -imgX / scale;
      const sy = -imgY / scale;
      const sW = FRAME_WIDTH / scale;
      const sH = frameHeight / scale;

      // Output 2x resolusi frame TAMPILAN utk kualitas cetak yg lebih
      // baik (bukan cuma preview-resolution) -- dibatasi maksimal wajar.
      const outW = Math.min(1200, FRAME_WIDTH * 2);
      const outH = Math.round(outW * (frameHeight / FRAME_WIDTH));

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = outW;
      outputCanvas.height = outH;
      const ctx = outputCanvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH);
      const dataUri = outputCanvas.toDataURL("image/jpeg", 0.92);

      if (saveToFtp && pin) {
        await request("/idcard/photo-retouch-save/", {
          method: "POST",
          body: JSON.stringify({ pin, photo_data: dataUri }),
        });
      }

      onRetouched(dataUri);
      onOpenChange(false);
    } catch (err) {
      setApplyError(extractErrorMessage(err, "Gagal menyimpan hasil retouch ke FTP -- foto TETAP dipakai utk kartu ini, cuma tidak tersimpan utk dipakai ulang."));
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retouch Foto</DialogTitle>
          <DialogDescription>Geser foto untuk atur posisi, gunakan slider untuk zoom. Area di dalam bingkai adalah yang akan tampil di kartu.</DialogDescription>
        </DialogHeader>

        {loadError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{loadError}</div>}

        <div className="flex flex-col items-center gap-3">
          <div
            className="touch-none overflow-hidden rounded-md border-2 border-primary bg-secondary/50"
            style={{ width: FRAME_WIDTH, height: frameHeight }}
          >
            <canvas
              ref={canvasRef} width={FRAME_WIDTH} height={frameHeight}
              className="cursor-move"
              onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
            />
          </div>

          {!imgLoaded && !loadError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat gambar...
            </div>
          )}

          {imgLoaded && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2">
                <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="range" min={1} max={3} step={0.05} value={zoomMultiplier}
                  onChange={(e) => setZoomMultiplier(Number(e.target.value))}
                  className="w-full"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Reset posisi & zoom" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {pin && (
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs">
                  <Checkbox checked={saveToFtp} onCheckedChange={(v) => setSaveToFtp(v === true)} className="mt-0.5" />
                  <span>
                    <span className="flex items-center gap-1 font-medium"><Cloud className="h-3 w-3" /> Simpan ke FTP untuk dipakai ulang</span>
                    <span className="block text-[11px] text-muted-foreground">Begitu disimpan, pencarian foto FTP berikutnya utk PIN ini akan menampilkan hasil retouch ini duluan -- tidak perlu atur ulang posisi tiap generate kartu baru.</span>
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {applyError && <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">{applyError}</div>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" disabled={!imgLoaded || applying} onClick={handleApply}>
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Terapkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
