"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, User, Users, CheckCircle2, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { WebcamCapture } from "@/components/shared/webcam-capture";
import { PhotoRetouchDialog } from "@/components/shared/photo-retouch-dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import { resolveMediaUrl } from "@/lib/media-url";
import type {
  IDCardType, IDCardTemplate, IDCardHolder, IDCardPhotoCandidate, IDCardDetail,
} from "@/types/api";

const CARD_TYPES: { value: IDCardType; label: string }[] = [
  { value: "karyawan", label: "Karyawan" },
  { value: "driver", label: "Driver" },
  { value: "visitor", label: "Visitor" },
  { value: "bhl", label: "BHL (Buruh Harian Lepas)" },
];

/**
 * Alur generate 1 ID Card baru -- SATU halaman, langkahnya beda
 * tergantung `cardType` (karyawan/driver PAKAI PIN & bisa cari foto
 * FTP, visitor/bhl PILIH holder yang SUDAH diinput di halaman Data
 * Visitor/BHL & foto SELALU shoot/upload manual, TIDAK ada sumber FTP
 * utk mereka).
 */
export default function GenerateIdCardPage() {
  const router = useRouter();
  const { request } = useApiClient();

  const [cardType, setCardType] = useState<IDCardType>("karyawan");
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");

  // --- Karyawan/Driver ---
  const [pin, setPin] = useState("");
  const [searchingEmployee, setSearchingEmployee] = useState(false);
  const [employeeFound, setEmployeeFound] = useState<{ pin: string; name: string } | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [ftpCandidates, setFtpCandidates] = useState<IDCardPhotoCandidate[]>([]);
  const [searchingPhotos, setSearchingPhotos] = useState(false);

  // --- Visitor/BHL ---
  const [holders, setHolders] = useState<IDCardHolder[]>([]);
  const [holderId, setHolderId] = useState<string>("");

  // --- Foto & extra ---
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<"ftp" | "shoot" | "upload">("shoot");
  const [retouchOpen, setRetouchOpen] = useState(false);
  const [extraText, setExtraText] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [result, setResult] = useState<IDCardDetail | null>(null);

  const isEmployeeLinked = cardType === "karyawan" || cardType === "driver";

  useEffect(() => {
    request<IDCardTemplate[]>(`/idcard/templates/?card_type=${cardType}`)
      .then((data) => setTemplates(data.filter((t) => t.is_active)))
      .catch(() => setTemplates([]));
    setTemplateId("");
    setEmployeeFound(null);
    setFtpCandidates([]);
    setPhotoDataUri(null);
    setHolderId("");
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardType]);

  useEffect(() => {
    if (isEmployeeLinked) return;
    request<{ results: IDCardHolder[] }>(`/idcard/holders/?card_type=${cardType}&_limit=100`)
      .then((data) => setHolders(data.results))
      .catch(() => setHolders([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardType, isEmployeeLinked]);

  async function handleSearchEmployee() {
    setSearchingEmployee(true);
    setEmployeeError(null);
    setEmployeeFound(null);
    setFtpCandidates([]);
    try {
      const data = await request<{ employees: { pin: string; name: string }[] }>(`/iclock/employee-search/?q=${encodeURIComponent(pin)}`);
      const exact = data.employees.find((e) => e.pin === pin.trim()) ?? data.employees[0];
      if (!exact) {
        setEmployeeError(`Employee dengan PIN '${pin}' tidak ditemukan.`);
        return;
      }
      setEmployeeFound(exact);
    } catch (err) {
      setEmployeeError(extractErrorMessage(err, "Gagal mencari employee."));
    } finally {
      setSearchingEmployee(false);
    }
  }

  async function handleSearchFtpPhotos() {
    if (!employeeFound) return;
    setSearchingPhotos(true);
    setFtpCandidates([]);
    try {
      const data = await request<{ results: IDCardPhotoCandidate[] }>(`/idcard/photo-search/?pin=${encodeURIComponent(employeeFound.pin)}&card_type=${cardType}`);
      setFtpCandidates(data.results);
    } catch (err) {
      setEmployeeError(extractErrorMessage(err, "Gagal mencari foto dari FTP."));
    } finally {
      setSearchingPhotos(false);
    }
  }

  function handleSelectFtpPhoto(candidate: IDCardPhotoCandidate) {
    setPhotoDataUri(candidate.data);
    setPhotoSource("ftp");
  }

  function handleWebcamCapture(dataUri: string) {
    setPhotoDataUri(dataUri);
    setPhotoSource("shoot");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUri(reader.result as string);
      setPhotoSource("upload");
    };
    reader.readAsDataURL(file);
  }

  const selectedHolder = holders.find((h) => String(h.id) === holderId);
  const canGenerate = Boolean(templateId && photoDataUri && (isEmployeeLinked ? employeeFound : holderId));

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const body: Record<string, unknown> = {
        card_type: cardType, template_id: Number(templateId),
        photo_source: photoSource, photo_data: photoDataUri, extra_text: extraText,
      };
      if (isEmployeeLinked) body.pin = employeeFound!.pin;
      else body.holder_id = Number(holderId);

      const card = await request<IDCardDetail>("/idcard/cards/generate/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(card);
    } catch (err) {
      setGenerateError(extractErrorMessage(err, "Gagal generate kartu."));
    } finally {
      setGenerating(false);
    }
  }

  if (result) {
    return (
      <div>
        <PageHeader title="Generate Kartu" description="Kartu berhasil dibuat." />
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <div>
            <p className="font-medium">Kartu untuk {result.holder_name} berhasil dibuat.</p>
            <p className="text-sm text-muted-foreground">Status: {result.status_label}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(result.card_image)} alt="Hasil kartu" className="w-48 rounded-md border border-border shadow-sm" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/idcard/cards/${result.id}`)}>Lihat Detail</Button>
            <Button onClick={() => setResult(null)}>Generate Kartu Lain</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Generate Kartu" description="Buat ID Card baru -- pilih jenis kartu, data pemegang, foto, dan template." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Jenis Kartu</Label>
            <Select value={cardType} onValueChange={(v) => setCardType(v as IDCardType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CARD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isEmployeeLinked ? (
            <div className="space-y-1.5">
              <Label htmlFor="gen-pin">PIN Employee</Label>
              <div className="flex gap-2">
                <Input id="gen-pin" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Masukkan PIN" />
                <Button type="button" variant="outline" onClick={handleSearchEmployee} disabled={!pin.trim() || searchingEmployee}>
                  {searchingEmployee ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {employeeError && <p className="text-xs text-destructive">{employeeError}</p>}
              {employeeFound && (
                <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs">
                  <User className="h-3.5 w-3.5 text-success" />
                  <span className="font-medium">{employeeFound.name}</span>
                  <span className="font-mono text-muted-foreground">({employeeFound.pin})</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Pilih Data {cardType === "visitor" ? "Visitor" : "BHL"}</Label>
              <Select value={holderId} onValueChange={setHolderId}>
                <SelectTrigger><SelectValue placeholder="Pilih dari data yang sudah diinput" /></SelectTrigger>
                <SelectContent>
                  {holders.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.full_name} {h.id_number && `(${h.id_number})`}</SelectItem>)}
                </SelectContent>
              </Select>
              {holders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada data. Tambahkan dulu lewat halaman{" "}
                  <a href="/idcard/holders" className="text-primary hover:underline">Data Visitor/BHL</a>.
                </p>
              )}
              {selectedHolder && (
                <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs">
                  <Users className="h-3.5 w-3.5 text-success" />
                  <span className="font-medium">{selectedHolder.full_name}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Pilih template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {templates.length === 0 && <p className="text-xs text-muted-foreground">Belum ada template aktif untuk jenis kartu ini.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gen-extra">Info Tambahan (opsional)</Label>
            <Input id="gen-extra" value={extraText} onChange={(e) => setExtraText(e.target.value)} placeholder="mis. Jabatan / Perusahaan" />
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <Label>Foto</Label>

          {isEmployeeLinked && employeeFound && (
            <div className="space-y-2">
              <Button type="button" variant="outline" size="sm" onClick={handleSearchFtpPhotos} disabled={searchingPhotos}>
                {searchingPhotos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Cari Foto dari FTP
              </Button>
              {ftpCandidates.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {ftpCandidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectFtpPhoto(c)}
                      className={`overflow-hidden rounded-md border-2 ${photoDataUri === c.data ? "border-primary" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.data} alt={c.label ?? c.path} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {searchingPhotos === false && ftpCandidates.length === 0 && (
                <p className="text-xs text-muted-foreground">Klik tombol di atas untuk cari foto, atau pakai kamera di bawah.</p>
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Atau shoot langsung / upload:</p>
            <WebcamCapture onCapture={handleWebcamCapture} />
            <div className="space-y-1.5">
              <Label htmlFor="gen-upload" className="text-xs">Upload File</Label>
              <Input id="gen-upload" type="file" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>

          {photoDataUri && (
            <div className="border-t border-border pt-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Foto terpilih:</p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoDataUri} alt="Foto terpilih" className="w-24 rounded-md border border-border" />
                <Button type="button" variant="outline" size="sm" onClick={() => setRetouchOpen(true)}>
                  <Wand2 className="h-3.5 w-3.5" /> Retouch
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Posisi kurang pas? Geser/zoom foto lewat Retouch sebelum generate kartu.</p>
            </div>
          )}

          <PhotoRetouchDialog
            open={retouchOpen}
            onOpenChange={setRetouchOpen}
            sourceImage={photoDataUri ?? ""}
            pin={isEmployeeLinked ? employeeFound?.pin : undefined}
            onRetouched={(dataUri) => setPhotoDataUri(dataUri)}
          />
        </Card>
      </div>

      {generateError && <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{generateError}</div>}

      <div className="mt-4 flex justify-end">
        <Button size="lg" onClick={handleGenerate} disabled={!canGenerate || generating}>
          {generating && <Loader2 className="h-4 w-4 animate-spin" />} Generate Kartu
        </Button>
      </div>
    </div>
  );
}
