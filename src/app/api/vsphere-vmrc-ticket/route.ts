import { NextRequest, NextResponse } from "next/server";
import { vsphereRequest, VsphereError } from "@/lib/vsphere-client";

/**
 * Ambil tiket console VMRC (VMware Remote Console) utk 1 VM, lalu susun
 * URI `vmrc://` LENGKAP di sini (server-side) -- BUKAN generic proxy
 * biasa (/api/vsphere/[...path]) krn perlu TRANSFORMASI hasil (tiket
 * mentah -> URI siap pakai), bukan sekadar diteruskan apa adanya.
 *
 * Alur (mirror ccpadms/test/vsphere/vmrc.get.ts):
 *   1. POST /rest/vcenter/vm/{vm}/console/tickets  {spec:{type:"VMRC"}}
 *   2. Response: {"value": {"type": "VMRC", "ticket": "..."}}
 *
 * ⚠️ KOREKSI PENTING dari versi sebelumnya -- DITEMUKAN LANGSUNG dari
 * error produksi: field `ticket` yang dikembalikan vCenter TERNYATA
 * BUKAN token mentah spt dugaan awal, MELAINKAN string yang SUDAH
 * berbentuk mirip URI vmrc LENGKAP (sudah termasuk host & `?moid=...`),
 * cuma skemanya "vmrc//" (kurang 1 titik dua) bukan "vmrc://", misalnya:
 *
 *   vmrc//clone:cst-VCT-<uuid>--tp-<thumbprint>@<vcenter-host>:443/?moid=<vm-id>
 *
 * Versi SEBELUMNYA mengasumsikan `ticket` cuma token polos, lalu
 * MEMBUNGKUSNYA LAGI dgn host & moid sendiri -- hasilnya jadi
 * "vmrc://clone:<ticket-yg-SUDAH-py-host-dan-moid>@<host-lagi>/?moid=<vm-lagi>"
 * -- DUPLIKAT host & moid, URI jadi tidak valid. Sekarang: pakai
 * `ticket` APA ADANYA, cuma perbaiki skemanya (vmrc// -> vmrc://) --
 * TIDAK menambah host/moid sendiri lagi (fallback ke cara lama HANYA
 * kalau ticket ternyata benar polos, tidak mengandung skema apa pun --
 * jaga-jaga kalau versi vCenter lain berperilaku beda).
 */
export async function GET(request: NextRequest) {
  const vm = request.nextUrl.searchParams.get("vm");
  if (!vm) {
    return NextResponse.json({ error: "Parameter 'vm' wajib diisi." }, { status: 400 });
  }

  const vcenterHost = process.env.VSPHERE_HOST || "";
  if (!vcenterHost) {
    return NextResponse.json({ error: "VSPHERE_HOST belum diisi di .env." }, { status: 500 });
  }

  try {
    const data = await vsphereRequest<{ value: { type: string; ticket: string } }>(
      "POST",
      `/rest/vcenter/vm/${encodeURIComponent(vm)}/console/tickets`,
      { spec: { type: "VMRC" } }
    );
    const ticket = data.value?.ticket;
    if (!ticket) {
      return NextResponse.json({ error: "vCenter tidak mengembalikan tiket VMRC." }, { status: 502 });
    }

    let uri: string;
    if (ticket.startsWith("vmrc://")) {
      // Sudah lengkap & benar apa adanya.
      uri = ticket;
    } else if (ticket.startsWith("vmrc//")) {
      // Kasus yang TERKONFIRMASI terjadi -- cuma kurang 1 titik dua stlh skema.
      uri = "vmrc://" + ticket.slice("vmrc//".length);
    } else {
      // Fallback -- ticket BENAR2 polos (tidak mengandung host/moid sama
      // sekali), susun manual spt versi awal.
      uri = `vmrc://clone:${ticket}@${vcenterHost}/?moid=${encodeURIComponent(vm)}`;
    }

    return NextResponse.json({ uri });
  } catch (err) {
    const status = err instanceof VsphereError ? err.status : 502;
    const message = err instanceof Error ? err.message : "Gagal mengambil tiket VMRC.";
    return NextResponse.json({ error: message }, { status });
  }
}
