# CCPADMS Frontend (Next.js)

Frontend Next.js untuk sistem manajemen device fingerprint & mobile
attendance — mengonsumsi API Django (`ccpadms`, repo terpisah) lewat
`/api/v1/...`. Dashboard server-rendered Django yang lama **tetap ada &
tetap jalan** (repo `ccpadms`) — ini BUKAN pengganti, tapi migrasi
bertahap ke frontend terpisah, berbagi backend & database yang sama.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- NextAuth v5 (Credentials provider → JWT Django, dgn refresh token rotation, `trustHost: true`)
- Tailwind CSS + komponen bergaya shadcn/ui (dibangun manual dari Radix UI primitives)
- Django Channels (WebSocket) via native browser WebSocket API, autentikasi JWT lewat query string
- `jsqr` — QR code scanning client-side (halaman Check/Meal mobile)

## Tiga Pengalaman Pengguna Terpisah

Repo ini melayani **3 populasi user berbeda**, dengan arsitektur autentikasi
yang SENGAJA beda-beda sesuai kebutuhan masing-masing:

### 1. `src/app/(dashboard)/` — Staff/Admin

Route group (URL TIDAK memuat `(dashboard)`). Sidebar penuh dgn dropdown
per-aplikasi (grup 1 item = link langsung, grup 2+ item = collapsible,
auto-expand kalau halaman aktif ada di grup itu). Autentikasi via NextAuth
(username/password staff, session JWT, refresh otomatis).

Halaman yang sudah lengkap (CRUD/list/action sesuai kebutuhan masing-masing):
- **Dashboard home** (`/`) — stat cards + transaksi terbaru
- **iClock**: Active Device, Employee, Department/Pool, Registered Device,
  Transaction (read-only), Attendance Recap, Operation Log, Device Log,
  Device Command
- **Mobile Attendance**: Log Absensi GPS, Face Profile
- **Mobile Pool (mclock)**: Mobile Pool, Mobile Pool Location (+ halaman
  gambar polygon di Google Maps), Pool Device Function
- **Manajemen User** (`/users`) — staff-only, CRUD akun lokal
- **Profil Saya** (`/profile`, `/profile/password`)

Semua tabel: pagination, search (`?q=`), sort (header kolom bisa diklik,
`?ordering=field`/`-field`, standar DRF `OrderingFilter`).

**Active Device** — halaman paling kaya fitur:
- Update real-time (WebSocket) utk kolom Status/Last Activity/Last Data,
  tanpa refresh — indikator "Live" di atas tabel
- Console WebSocket **draggable** (panel melayang, tutup pakai ikon X,
  bukan panel tetap yg menggeser layout)
- Menu aksi per device: Sync Waktu, Live Users (dialog terpisah dgn
  pagination/sort server-side, aksi toggle-privilege/delete per user),
  Backup Fingerprint, Transfer Finger (dari device ini, live, banyak PIN
  sekaligus), Network Params, Generic Param, Reboot (dgn konfirmasi)

**Employee** — tombol Set as Admin (toggle privilege) & Transfer Finger
(dari database, sumber tidak perlu online, ke pool/device tujuan).

### 2. `src/app/(portal)/portal/` — Non-Staff dengan Izin Granular

Route group TERPISAH, layout MINIMAL (header sederhana, TANPA sidebar
dashboard). Untuk user non-staff yang diberi izin fitur spesifik lewat
"Kelola Izin User" di dashboard Django (`iclock.can_transfer_finger` /
`iclock.can_view_attendance_recap`, model dummy `FeaturePermission`).

Halaman utama (`/portal`) — **card button**, BUKAN sidebar: "Profil Saya"
& "Ganti Password" selalu ada, "Transfer Data Finger" & "Rekap Absensi"
muncul KONDISIONAL sesuai flag permission dari `/me/`. Kedua fitur
terakhir py halaman TERSENDIRI yang lebih sederhana dari versi staff
(bukan reuse tabel Employee/Active Device penuh) — Transfer Finger: cari
employee by PIN → pilih pool/device → submit. Attendance Recap: matrix
sama spt staff TAPI tanpa dropdown Pool/Device (endpoint itu tetap
staff-only, sengaja tidak dibuka ke portal).

### 3. `src/app/mobile/` — Karyawan (Check In/Out/Meal)

**BUKAN route group** (tanpa tanda kurung — `/mobile/...` MEMANG muncul
di URL). Autentikasi **SAMA SEKALI TERPISAH** dari NextAuth: PIN + password
mobile (`POST /api/v1/mattendance/auth/login/`, backend
`EmployeeMobileBackend`, beda total dari login staff), token disimpan di
`localStorage` lewat `lib/mobile-auth-context.tsx` (React Context custom,
BUKAN NextAuth) — `src/middleware.ts` mengecualikan TOTAL path `/mobile`
dari pengecekan NextAuth (server-side middleware tidak bisa baca
localStorage sama sekali, jadi pengecekan login utk area ini murni
client-side lewat `AuthGate` di `src/app/mobile/layout.tsx`).

Alur: Login (PIN) → Ganti Password (kalau login pertama/wajib) → Absen
Masuk/Keluar (kamera+GPS+wajah) ATAU Absen Makan (QR+GPS) → Riwayat. Kalau
belum pernah daftar wajah, diarahkan ke halaman Daftar Wajah dulu (sekali
seumur hidup).

**Perbaikan UX penting** (`_components/status-overlay.tsx`): pesan
status/error **absolute-positioned DI DALAM container kamera** (bukan
elemen terpisah di bawahnya yang muncul/hilang mendorong layout) — tombol
Check-in/out JUGA selalu di posisi yang SAMA PERSIS (cuma `disabled`,
tidak pernah disembunyikan/dipindah) — keduanya SELALU terlihat tanpa
perlu scroll.

## Setup (Development)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Jalankan Django API-nya dulu (`python manage.py runserver` atau via
Docker, lihat `ccpadms/docker/`).

`.env.local` — isi yang WAJIB:
- `NEXTAUTH_SECRET` — generate `openssl rand -base64 32`
- `NEXTAUTH_URL` — URL frontend ini sendiri (mis. `http://localhost:3000`)

`.env.local` — BOLEH DIKOSONGKAN (lihat "Arsitektur URL" di bawah):
- `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL`

## Docker (Test Production)

Setup Docker Compose (Redis + MySQL + Django [web+celery, 1 image] +
Next.js + nginx dgn HTTPS) ada di **repo `ccpadms`**, folder `docker/` —
baca `ccpadms/docker/README.md` utk instruksi lengkap. Next.js repo ini
diasumsikan di-clone SEJAJAR dgn `ccpadms` (`context: ../../nextadms` di
`docker-compose.yml`).

`docker/nextjs/Dockerfile` (di repo INI) — multi-stage build, output
`standalone` (`next.config.mjs`), kode DIBUNGKUS ke image saat build
(BEDA dari Django yang bind-mount — Next.js production build memang
lazimnya immutable image).

## Arsitektur URL — Kenapa `NEXT_PUBLIC_*` Boleh Kosong

Ada **3 konteks fetch berbeda**, masing-masing strategi URL beda:

1. **Browser** (`lib/api-client.ts`, `lib/mobile-auth-context.tsx`) —
   default path **RELATIF** (`/api/v1/...`), browser otomatis resolve
   terhadap origin App ini sendiri SAAT ITU — akses dari `localhost`, IP
   LAN, atau domain apa pun, otomatis benar, TIDAK PERLU rebuild.
2. **WebSocket** (`lib/iclock-ws-context.tsx`) — beda dari HTTP (WebSocket
   butuh URL LENGKAP, tidak bisa relatif), dihitung DINAMIS dari
   `window.location` (protokol+host SAAT ITU) tiap kali browser buka
   halamannya.
3. **Server Next.js** (`lib/api-server.ts`, `lib/auth.ts` — Server
   Component & NextAuth authorize/refresh, jalan DI DALAM container
   `nextjs`) — TIDAK lewat nginx/IP publik, langsung ke
   `http://django-web:8000` lewat jaringan internal Docker. Env var
   `DJANGO_INTERNAL_URL` (BUKAN `NEXT_PUBLIC_*`) — dibaca saat RUNTIME,
   ganti nilainya TIDAK PERLU rebuild image.

`NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_WS_BASE_URL` TETAP bisa diisi
eksplisit sbg override kalau API memang di origin BERBEDA dari halaman
Next.js-nya sendiri (skenario TIDAK disatukan nginx).

### ⚠️ Jebakan yang ditemukan & diperbaiki (Next.js di balik reverse proxy)

- **`req.url` di middleware TIDAK bisa diandalkan** di balik nginx —
  walau `trustHost: true` aktif di NextAuth (`lib/auth.ts`), itu cuma
  mempengaruhi NextAuth secara internal, BUKAN cara Next.js sendiri
  mengisi `req.url` di middleware. Diuji langsung (server standalone
  sungguhan + Host header simulasi): redirect middleware PERNAH balik ke
  `NEXTAUTH_URL` (mis. "localhost") meski diakses dari domain lain.
  **Fix**: `src/middleware.ts::buildAbsoluteUrl()` baca header `Host`/
  `X-Forwarded-Host`/`X-Forwarded-Proto` LANGSUNG dari request, bukan
  `req.url`.
- **`signOut({ callbackUrl })` JUGA kena masalah sama** — NextAuth
  membangun URL redirect setelah logout secara internal, TIDAK SELALU
  akurat di balik proxy (pola sama dgn di atas, kode BEDA — internal
  NextAuth, bukan kode kita). **Fix**: `signOut({ redirect: false })` +
  `window.location.href` manual (SELALU akurat, relatif thd halaman yg
  SEDANG dibuka browser, tidak ada "tebak host" di server sama sekali) —
  dipakai di `topbar.tsx`, `portal-header.tsx`, `providers.tsx`
  (auto-logout saat refresh token invalid).
- Nginx `$host` MEMBUANG PORT dari Host header (BUKAN masalah kode
  Next.js, tapi berdampak ke request yg diterima Next.js) — lihat
  `ccpadms/README.md` bagian 30.4 utk detail lengkap sisi nginx-nya.

## Struktur Direktori Kunci

```
src/app/
  (dashboard)/         staff, sidebar penuh
    iclock/             Active Device, Employee, Department, dst
    mattendance/         Log Absensi GPS, Face Profile
    mclock/              Mobile Pool, Mobile Pool Location, Pool Device Function
    users/               Manajemen User
    profile/             Profil staff
  (portal)/portal/      non-staff, card button, izin granular
  mobile/                karyawan, PIN login, TANPA tanda kurung (di URL)
  login/                 halaman login staff/portal (NextAuth)
  api/auth/[...nextauth]/ NextAuth route handler

src/lib/
  auth.ts                config NextAuth (trustHost, JWT refresh)
  api-client.ts           fetch client-side (dashboard/portal), path relatif
  api-server.ts           fetch server-side (Server Component), DJANGO_INTERNAL_URL
  mobile-auth-context.tsx  auth TERPISAH utk /mobile (localStorage, bukan NextAuth)
  iclock-ws-context.tsx    WebSocket shared context (1 koneksi, banyak consumer)

src/components/
  layout/                sidebar, topbar, nav-config (dashboard staff)
  shared/                SearchBar, PaginationBar, SortableHeader, dll (dipakai lintas halaman)
  ui/                     primitives gaya shadcn/ui
```

## Catatan Pengujian

Semua fitur di atas sudah lolos `npm run build` (TypeScript strict, zero
error) di setiap sesi. Interaksi VISUAL sungguhan (klik tombol, drag
console, kamera/GPS/QR di HP, WebSocket real-time end-to-end) **belum**
bisa diverifikasi penuh dari sandbox pengembangan (tidak ada browser/HP
fisik) — sejauh ini sudah dites & dikonfirmasi bekerja LANGSUNG oleh user
utk: login, WebSocket Active Device, routing nginx, redirect HTTPS,
logout. Fitur lain (mobile check-in kamera/GPS/QR sungguhan, drag
console, dst) masih menunggu konfirmasi pengujian langsung.
