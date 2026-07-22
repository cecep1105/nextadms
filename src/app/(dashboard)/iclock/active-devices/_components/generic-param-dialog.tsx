"use client";
import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";

export function GenericParamDialog({
  sn, alias, open, onOpenChange,
}: {
  sn: string;
  alias: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { request } = useApiClient();
  const [mode, setMode] = useState<"get" | "set">("get");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [getResult, setGetResult] = useState<string | null>(null);
  const [setResult, setSetResult] = useState<string | null>(null);

  const [getParamName, setGetParamName] = useState("");
  const [setParamName, setSetParamName] = useState("");
  const [setParamValue, setSetParamValue] = useState("");
  const [doRefresh, setDoRefresh] = useState(true);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setError(null);
      setGetResult(null);
      setSetResult(null);
      setGetParamName("");
      setSetParamName("");
      setSetParamValue("");
    }
  }

  async function handleGet(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGetResult(null);
    try {
      const result = await request<{ success: boolean; value?: string; message?: string }>(
        `/iclock/active-device/${sn}/generic-param/`,
        { method: "POST", body: JSON.stringify({ action: "get", param_name: getParamName }) }
      );
      if (result.success) setGetResult(result.value ?? "");
      else setError(result.message ?? "Gagal membaca parameter.");
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal membaca parameter."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSetResult(null);
    try {
      const result = await request<{ success: boolean; message: string }>(
        `/iclock/active-device/${sn}/generic-param/`,
        { method: "POST", body: JSON.stringify({ action: "set", param_name: setParamName, param_value: setParamValue, do_refresh: doRefresh }) }
      );
      if (result.success) setSetResult(result.message);
      else setError(result.message);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah parameter."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generic Param — {alias}</DialogTitle>
          <DialogDescription>
            Baca/ubah parameter konfigurasi apapun di device (lihat dokumentasi PUSH SDK utk daftar
            nama item, mis. <code>VOLUME</code>, <code>WorkCode</code>, <code>DHCP</code>).
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

        <Tabs value={mode} onValueChange={(v) => setMode(v as "get" | "set")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="get">Baca (Get)</TabsTrigger>
            <TabsTrigger value="set">Ubah (Set)</TabsTrigger>
          </TabsList>

          <TabsContent value="get">
            <form onSubmit={handleGet} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="get_param">Nama Parameter</Label>
                <Input id="get_param" value={getParamName} onChange={(e) => setGetParamName(e.target.value)} placeholder="mis. VOLUME" className="font-mono" required />
              </div>
              {getResult !== null && (
                <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 font-mono text-xs text-success">
                  {getParamName} = {getResult || "(kosong)"}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Tutup</Button>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Baca</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="set">
            <form onSubmit={handleSet} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="set_param">Nama Parameter</Label>
                <Input id="set_param" value={setParamName} onChange={(e) => setSetParamName(e.target.value)} placeholder="mis. VOLUME" className="font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set_value">Nilai Baru</Label>
                <Input id="set_value" value={setParamValue} onChange={(e) => setSetParamValue(e.target.value)} className="font-mono" />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={doRefresh} onCheckedChange={(v) => setDoRefresh(!!v)} />
                Refresh konfigurasi device setelah diubah
              </label>
              {setResult && <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{setResult}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Tutup</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings2 className="h-3.5 w-3.5" />} Terapkan
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
