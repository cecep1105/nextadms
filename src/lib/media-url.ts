/**
 * Ubah URL media (foto/gambar) dari API Django jadi URL yang PASTI bisa
 * diakses browser -- Django SEHARUSNYA sudah balikin URL ABSOLUTE
 * (http://host/media/...) lewat context={'request': request} di
 * serializer (lihat idcard/api_views.py), TAPI itu BERGANTUNG pada
 * Django bisa BENAR baca header Host dari request yang masuk --
 * `runserver` (server development bawaan Django) TERBUKTI py
 * keterbatasan soal ini kalau diakses lewat topologi jaringan yang
 * tidak sederhana (mis. port-forwarding Docker), BISA balikin
 * '127.0.0.1:8000' (perspektif INTERNAL container) drpd host yang
 * SEBENARNYA dipakai browser.
 *
 * Fungsi ini jadi LAPISAN AMAN TAMBAHAN yang TIDAK BERGANTUNG pada
 * Django benar/salah baca Host-nya sendiri:
 * - Kalau URL dari API SUDAH absolute (diawali http:// atau https://),
 *   dipakai APA ADANYA (TIDAK diutak-atik, hormati apa pun yang Django
 *   sudah tentukan benar).
 * - Kalau URL RELATIVE (mis. '/media/idcard/templates/bg.png' -- ini
 *   yang terjadi kalau Django GAGAL resolve host-nya sendiri, ATAU
 *   memang sengaja dikonfigurasi begitu), digabung dgn
 *   NEXT_PUBLIC_MEDIA_URL (base URL media yang DIISI MANUAL di .env
 *   Next.js, TIDAK bergantung sama sekali pada Django) sbg fallback.
 *
 * Kalau NEXT_PUBLIC_MEDIA_URL TIDAK diisi & URL dari API kebetulan
 * relative, dikembalikan APA ADANYA (browser akan resolve relatif ke
 * origin Next.js sendiri -- BISA salah kalau Django beda origin, tapi
 * ini best-effort terakhir, LEBIH BAIK drpd melempar error/gambar
 * kosong).
 */
const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

// export function resolveMediaUrl1(url: string | null | undefined): string {
//   if (!url) return "";
//   if (/^https?:\/\//i.test(url)) return url;
//   if (!MEDIA_BASE_URL) return url;


//   const path = url.replace(/^\/media\//, "/");
//   return `${MEDIA_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;  
// }


export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!BACKEND_BASE_URL) return url;
  const path = new URL(url).pathname;
  return `${BACKEND_BASE_URL}${path}`;
}

