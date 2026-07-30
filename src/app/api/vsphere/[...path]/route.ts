import { NextRequest, NextResponse } from "next/server";
import { vsphereRequest, VsphereError } from "@/lib/vsphere-client";

/**
 * Proxy generik ke vCenter REST API -- mirror dari pola yang SUDAH ADA
 * di ccpadms/test/vsphere/vm.ts (Nuxt), dipindahkan ke Next.js API route
 * sesuai permintaan (API dibuat di Next.js, BUKAN di-proxy lewat
 * Django) -- path setelah /api/vsphere/ diteruskan APA ADANYA ke
 * `/rest/vcenter/<path>` di vCenter.
 *
 * Contoh: GET /api/vsphere/host        -> GET  https://<vcenter>/rest/vcenter/host
 *         GET /api/vsphere/vm          -> GET  https://<vcenter>/rest/vcenter/vm
 *         POST /api/vsphere/vm/vm-1/power/start -> POST https://<vcenter>/rest/vcenter/vm/vm-1/power/start
 *
 * Autentikasi & session caching ditangani `vsphereRequest()` (lihat
 * src/lib/vsphere-client.ts) -- route ini TIDAK perlu tahu detail
 * login/session sama sekali.
 */
async function handle(request: NextRequest, path: string[]) {
  const vcenterPath = "/rest/vcenter/" + path.join("/");
  const search = request.nextUrl.search;
  let body: unknown;
  if (request.method === "POST" || request.method === "PATCH" || request.method === "PUT") {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  try {
    const data = await vsphereRequest(request.method, vcenterPath + search, body);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof VsphereError ? err.status : 502;
    const message = err instanceof Error ? err.message : "Gagal menghubungi vCenter.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handle(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handle(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handle(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handle(request, path);
}
