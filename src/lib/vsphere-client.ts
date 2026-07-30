import https from "https";

/**
 * Client vCenter REST API (vSphere 7.0, gaya LAMA `/rest/...` -- BUKAN
 * `/api/...` yang lebih baru, mengikuti contoh existing di
 * `ccpadms/test/vsphere/vm.ts`/`vmrc.get.ts` -- pola sama, dipindahkan
 * ke Next.js API route sesuai permintaan (bukan proxy lewat Django).
 *
 * KENAPA PAKAI `https` NATIVE (bukan `fetch()` biasa): vCenter appliance
 * ON-PREM HAMPIR SELALU pakai sertifikat SELF-SIGNED (bukan dari CA
 * publik) -- `fetch()` bawaan (undici) TIDAK PUNYA cara simpel/stabil
 * lintas versi Node utk menerima sertifikat self-signed per-request,
 * sedangkan `https.request()` PUNYA opsi `rejectUnauthorized` bawaan yang
 * SANGAT STABIL (API Node.js sejak lama, tidak berubah antar versi).
 *
 * SESI vCenter di-CACHE di memori module-level (BUKAN re-login tiap
 * request) -- proses Next.js ini jalan LAMA (bukan serverless sekali
 * pakai), jadi cache sederhana begini cukup efektif. Re-login otomatis
 * kalau request gagal 401 (sesi kedaluwarsa) ATAU belum pernah login.
 */
const VSPHERE_HOST = process.env.VSPHERE_HOST || "";
const VSPHERE_USER = process.env.VSPHERE_USER || "";
const VSPHERE_PASSWORD = process.env.VSPHERE_PASSWORD || "";
// vCenter on-prem BIASANYA sertifikat self-signed -- default TRUE (terima
// self-signed) supaya langsung jalan tanpa konfigurasi tambahan. Set ke
// "false" di .env KALAU vCenter Anda SUDAH pakai sertifikat CA resmi &
// mau validasi ketat.
const ALLOW_SELF_SIGNED = (process.env.VSPHERE_ALLOW_SELF_SIGNED_CERT ?? "true") !== "false";

export class VsphereError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RawResponse {
  status: number;
  body: unknown;
}

/** Request HTTP mentah ke vCenter -- generik, dipakai LOGIN & request biasa. */
function rawRequest(method: string, path: string, headers: Record<string, string>, body?: unknown): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    if (!VSPHERE_HOST) {
      reject(new VsphereError(500, "VSPHERE_HOST belum diisi di .env."));
      return;
    }
    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: VSPHERE_HOST,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
          ...headers,
        },
        rejectUnauthorized: !ALLOW_SELF_SIGNED,
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          let parsed: unknown = null;
          if (data) {
            try { parsed = JSON.parse(data); } catch { parsed = data; }
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Timeout menghubungi vCenter.")));
    req.on("error", (err) => reject(new VsphereError(502, `Gagal menghubungi vCenter: ${err.message}`)));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

let cachedSessionId: string | null = null;

async function login(): Promise<string> {
  if (!VSPHERE_USER || !VSPHERE_PASSWORD) {
    throw new VsphereError(500, "VSPHERE_USER/VSPHERE_PASSWORD belum diisi di .env.");
  }
  const auth = Buffer.from(`${VSPHERE_USER}:${VSPHERE_PASSWORD}`).toString("base64");
  const res = await rawRequest("POST", "/rest/com/vmware/cis/session", { Authorization: `Basic ${auth}` });
  if (res.status !== 200 || typeof (res.body as { value?: string })?.value !== "string") {
    throw new VsphereError(res.status || 502, `Login vCenter gagal (status ${res.status}): ${JSON.stringify(res.body)}`);
  }
  cachedSessionId = (res.body as { value: string }).value;
  return cachedSessionId;
}

/**
 * Request ke endpoint vCenter APA PUN (dgn path lengkap, mis.
 * "/rest/vcenter/host") -- otomatis login dulu kalau belum py sesi
 * ter-cache, & otomatis LOGIN ULANG + ulangi request SEKALI kalau
 * response awal 401 (sesi kedaluwarsa -- vCenter session timeout
 * default ~30 menit tidak aktif).
 */
export async function vsphereRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  if (!cachedSessionId) {
    await login();
  }

  let res = await rawRequest(method, path, { "vmware-api-session-id": cachedSessionId! }, body);

  if (res.status === 401) {
    // Sesi kedaluwarsa -- login ulang SEKALI, coba lagi.
    await login();
    res = await rawRequest(method, path, { "vmware-api-session-id": cachedSessionId! }, body);
  }

  if (res.status >= 400) {
    throw new VsphereError(res.status, `vCenter API error (${res.status}) utk ${method} ${path}: ${JSON.stringify(res.body)}`);
  }

  return res.body as T;
}
