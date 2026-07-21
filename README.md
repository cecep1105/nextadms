# CCPADMS Frontend (Next.js)

Frontend baru untuk sistem manajemen device fingerprint & mobile attendance —
mengonsumsi API Django (`ccpadms`) yang sudah ada.

## Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- NextAuth v5 (Credentials provider → JWT Django, dgn refresh token rotation)
- Tailwind CSS + komponen bergaya shadcn/ui (dibangun manual dari Radix UI
  primitives -- registry `ui.shadcn.com` tidak bisa diakses dari sandbox
  pengembangan, tapi fungsinya identik, tinggal pakai seperti biasa)

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local`:
- `NEXT_PUBLIC_API_BASE_URL` — URL API Django, mis. `http://127.0.0.1:8000/api/v1`
- `NEXTAUTH_SECRET` — generate dengan `openssl rand -base64 32`
- `NEXTAUTH_URL` — URL frontend ini sendiri, mis. `http://localhost:3000`

Jalankan Django API-nya dulu (`python manage.py runserver`), baru:

```bash
npm run dev
```

## ⚠️ WAJIB diterapkan ke Django dulu

Beberapa serializer DRF (`iclock/serializers.py`) saya update supaya field-nya
konsisten dgn dashboard (LogStamp dkk di ActiveDevice, LastPool/LastDevice di
Employee, Alias/LastActivity di RegisteredDevice, Function/EmployeePIN di
Transaction). File lengkapnya ada di `django_serializers_update.py` di folder
yang sama dgn zip ini — timpa ke `ccpadms/iclock/serializers.py`.

## Status implementasi

✅ SELESAI & teruji (`npm run build` sukses, zero error TypeScript):
- Autentikasi penuh (login, refresh token otomatis, logout, proteksi route)
- Shell dashboard (sidebar, topbar, dark/light theme)
- Dashboard home (stat cards + transaksi terbaru)
- **Active Device** — list, search, pagination, tambah/edit/hapus, semua field PUSH SDK
- **Employee** — list, search, pagination, tambah/edit/hapus, kolom Last Pool/Last Device/Last Seen
- **Department/Pool** — CRUD penuh
- **Registered Device** — edit (dengan feedback aktivasi ke Active Device), hapus
- **Transaction** — list read-only (tanpa edit, sesuai keputusan dashboard) + hapus
- **Mobile Pool** — CRUD penuh (dengan catatan "data testing, tertimpa sync")
- **Mobile Pool Location (Geofence)** — list dikelompokkan per PoolID + halaman
  "Gambar Polygon di Peta" (Google Maps, klik-tambah-titik, drag utk koreksi,
  simpan MENGGANTI seluruh titik lama). Endpoint bulk-save BARU
  (`mclock/api_views.py::MobilePoolLocBulkSaveAPIView`) sudah teruji penuh
  di sisi Django (create, replace, validasi <3 titik, format rusak, routing).
  ⚠️ Interaksi peta sungguhan (klik/drag di browser) BELUM bisa saya
  verifikasi visual di sandbox ini (tidak ada browser + API key sungguhan) —
  tolong dicoba langsung & kabari kalau ada yg perlu disesuaikan.

🐛 **Bug ditemukan & diperbaiki sesi ini**: SearchBar di semua halaman
sebelumnya kirim `?search=`, padahal backend Django expect `?q=` — pencarian
diam-diam tidak berfungsi (backend abaikan param tak dikenal). Sudah
diperbaiki di semua halaman + komponen `SearchBar` itu sendiri.

⏳ BELUM dikerjakan (sudah ada di sidebar, halaman belum dibuat):
Pool Device Function, Attendance Recap, Operation Log, Device Command,
Log Absensi GPS (mattendance), Face Profile, Manajemen User, halaman Profil.

Pola SEMUA halaman ini SAMA PERSIS dgn yang sudah jadi (lihat folder
`src/app/(dashboard)/iclock/employees/` sbg contoh paling lengkap) --
Server Component fetch data, Client Component utk dialog form, komponen
`SearchBar`/`PaginationBar`/`DeleteConfirmButton` dipakai bersama.

## ⚠️ WAJIB diterapkan ke Django (update kedua)

Selain `django_serializers_update.py` (dari sesi sebelumnya), sesi ini
menambahkan endpoint BARU: `mclock/api_views.py::MobilePoolLocBulkSaveAPIView`
+ `mclock/api_urls.py` (urutan url path PENTING, endpoint literal harus di
ATAS `router.urls`). Lihat `django_mclock_update/` di folder yang sama dgn zip ini.

