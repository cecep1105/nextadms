"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { MikrotikDhcpLease } from "@/types/api";

type Step = "lookup" | "form";

/**
 * Versi PORTAL dari GrantAccessDialog (staff) -- alur & UI SAMA PERSIS,
 * BEDA cuma di endpoint lookup DHCP: staff pakai proxy generik
 * (/netmgmt/routeros/<host>/ip-dhcp_server-lease/, staff-only), portal
 * pakai /netmgmt/portal/dhcp-lease/ (endpoint TERBATAS, aman utk
 * non-staff -- lihat netmgmt/portal_views.py). Aksi Grant Access
 * ITU SENDIRI (POST /firewall/grant-access/) TETAP endpoint yang SAMA
 * dgn staff (permission-nya SUDAH diperluas trima izin portal juga).
 */
export function PortalGrantAccessDialog({ routerHost }: { routerHost: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("lookup");

  const [ipAddress, setIpAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundLease, setFoundLease] = useState<MikrotikDhcpLease | null>(null);

  const [hostname, setHostname] = useState("");
  const [interfaceType, setInterfaceType] = useState<"WIFI" | "LAN">("WIFI");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetAll() {
    setStep("lookup");
    setIpAddress("");
    setSearchError(null);
    setFoundLease(null);
    setHostname("");
    setInterfaceType("WIFI");
    setUsername("");
    setSubmitError(null);
    setSuccess(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetAll();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      const data = await request<{ results: MikrotikDhcpLease[] }>(
        `/netmgmt/portal/dhcp-lease/?_q=${encodeURIComponent(ipAddress)}&_search_fields=address&_limit=1`
      );
      const lease = data.results[0];
      if (!lease) {
        setSearchError(`Tidak ada DHCP lease dengan IP address '${ipAddress}'. Pastikan device sudah pernah dapat IP dari DHCP.`);
        return;
      }
      setFoundLease(lease);
      setHostname(lease["host-name"] || "");
      setStep("form");
    } catch (err) {
      setSearchError(extractErrorMessage(err, "Gagal mencari DHCP lease."));
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!foundLease) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await request<{ message: string; comment: string }>(
        `/netmgmt/routeros/${routerHost}/firewall/grant-access/`,
        {
          method: "POST",
          body: JSON.stringify({
            mac_address: foundLease["mac-address"],
            hostname,
            interface: interfaceType,
            username,
          }),
        }
      );
      setSuccess(result.comment);
      router.refresh();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Gagal membuat rule firewall."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <ShieldPlus className="h-3.5 w-3.5" /> Berikan Akses Internet
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Berikan Akses Internet</DialogTitle>
          <DialogDescription>
            {step === "lookup"
              ? "Masukkan IP address device -- MAC address-nya akan dicari otomatis dari DHCP lease."
              : "Rule baru akan disisipkan tepat sebelum rule 'BLOCK-ELSE', menyalin pengaturan (chain/action/dst) dari rule yang ada di posisi itu sekarang."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              Rule berhasil ditambahkan dengan comment: <span className="font-mono font-medium">{success}</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAll}>Tambah Lagi</Button>
              <Button onClick={() => handleOpenChange(false)}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : step === "lookup" ? (
          <form onSubmit={handleSearch} className="space-y-4">
            {searchError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{searchError}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="ip">IP Address Device</Label>
              <Input id="ip" required value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="font-mono" placeholder="192.168.1.50" autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={searching}>
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Cari
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{submitError}</div>}

            <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs">
              <p>MAC Address: <span className="font-mono font-medium">{foundLease?.["mac-address"]}</span></p>
              <p className="text-muted-foreground">IP: {foundLease?.address}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hostname">Nama Host</Label>
              <Input id="hostname" required value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="laptop-budi" />
            </div>

            <div className="space-y-1.5">
              <Label>Interface</Label>
              <Select value={interfaceType} onValueChange={(v) => setInterfaceType(v as "WIFI" | "LAN")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIFI">WIFI</SelectItem>
                  <SelectItem value="LAN">LAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Nama User</Label>
              <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Budi Santoso" />
            </div>

            <div className="rounded-md border border-border px-3 py-2 text-[11px] text-muted-foreground">
              Preview comment: <span className="font-mono">{hostname || "..."}</span>|<span className="font-mono">{interfaceType}</span>|<span className="font-mono">{username || "..."}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("lookup")}>Kembali</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldPlus className="h-3.5 w-3.5" />} Buat Rule
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
