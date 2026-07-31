export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Department {
  DeptID: number;
  DeptName: string;
  NetID: number;
  DeptRouter: string;
  DeptSubnet: string;
}

export interface DeviceLiveUser {
  user_id: string;
  name: string;
  privilege: number;
  password?: string;
  group_id?: string;
  card?: number;
}

export interface ActiveDevice {
  SN: string;
  Alias: string;
  DeptID: number | null;
  DeptName: string | null;
  Function: string | null;
  IPAddress: string | null;
  MAC: string | null;
  TZAdj: number | null;
  State: number;
  LastActivity: string | null;
  LastData: string | null;
  PushVersion: string | null;
  LogStamp: string | null;
  OpLogStamp: string | null;
  PhotoStamp: string | null;
  TransTimes: string | null;
  TransInterval: number;
  UpdateDB: string;
  ErrorDelay: number;
  Delay: number;
  Realtime: boolean;
  Encrypt: boolean;
}

export interface RegisteredDevice {
  id: number;
  SN: string;
  Alias: string | null;
  DeviceName: string | null;
  DeptID: number | null;
  DeptName: string | null;
  Function: string | null;
  IPAddress: string | null;
  MAC: string | null;
  IPRouter: string | null;
  LastActivity: string | null;
}

export interface Employee {
  id: number;
  PIN: string;
  EName: string | null;
  DeptID: number | null;
  DeptName: string | null;
  SN: string | null;
  Gender: string | null;
  Title: string | null;
  Card: string | null;
  Privilege: number | null;
  Tele: string | null;
  Mobile: string | null;
  Password?: string;
  UTime: string | null;
  LastVerify: number | null;
  LastPool: string | null;
  LastDevice: string | null;
}

export interface Transaction {
  id: number;
  UserID: number;
  EmployeeName: string | null;
  EmployeePIN: string | null;
  TTime: string;
  State: string;
  StateDisplay: string;
  Verify: number;
  VerifyDisplay: string;
  SN: string | null;
  Function: string | null;
}

export interface FingerprintTemplate {
  id: number;
  UserID: number;
  EmployeeName: string | null;
  FingerID: number;
  FingerIDDisplay: string;
  Valid: number;
  SN: string | null;
}

export interface OperationLog {
  id: number;
  SN: string | null;
  admin: number;
  OP: number;
  OpName: string;
  OPTime: string;
  Object: number | null;
  Param1: number | null;
  Param2: number | null;
  Param3: number | null;
}

export interface DeviceLog {
  id: number;
  SN: string;
  OP: string;
  Object: string | null;
  Cnt: number;
  ECnt: number;
  OpTime: string;
}

export interface DeviceCommand {
  id: number;
  SN: string;
  CmdContent: string;
  CmdCommitTime: string;
  CmdTransTime: string | null;
  CmdOverTime: string | null;
  CmdReturn: string | null;
  User: number | null;
  Username: string | null;
}

export interface MobilePool {
  PoolID: string;
  PoolCode: string | null;
  PoolName: string | null;
  Latitude: string | null;
  Longitude: string | null;
  Radius: number | null;
  SyncedAt: string | null;
}

export interface MobilePoolLoc {
  id: number;
  PoolID: string;
  Urut: number;
  Latitude: string;
  Longitude: string;
}

export interface PoolDeviceFunction {
  id: number;
  PoolID: string;
  function_type: "KANTIN" | "BUKAN_KANTIN";
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: number;
  username: string;
  timestamp: string;
  check_type: string;
  check_type_display: string;
  pool_id: string | null;
  pool_name: string | null;
  location_verified: boolean;
  face_verified: boolean;
  face_distance: number | null;
  qr_content: string | null;
  Function: string | null;
}

export interface FaceProfile {
  id: number;
  pin: string;
  employee_name: string | null;
  is_locked: boolean;
  enrolled_at: string;
  updated_at: string;
}

export interface RecapDateColumn {
  date: string;
  day_name: string;
}

export interface RecapCell {
  date: string;
  in_first: string | null;
  in_count: number;
  out_last: string | null;
  out_count: number;
}

export interface RecapRow {
  no: number;
  pin: string;
  name: string;
  cells: RecapCell[];
}

export interface AttendanceRecapResponse {
  count: number;
  page: number;
  page_size: number;
  date_columns: RecapDateColumn[];
  results: RecapRow[];
}

export interface EmployeeSearchResult {
  id: number;
  pin: string;
  name: string;
}

export interface PoolDeviceChoicesResponse {
  pools: { id: number; name: string }[];
  devices?: { sn: string; name: string }[];
}

export interface AttendanceRecapCardRow {
  date: string;
  time: string;
  device: string | null;
  type: "IN" | "OUT";
}

export interface AttendanceRecapCardResponse {
  pin: string;
  name: string | null;
  year: number;
  month: number;
  rows: AttendanceRecapCardRow[];
}

/** Bentuk pagination KHUSUS UserViewSet -- BEDA dari Paginated<T> standar (num_pages/current_page, bukan next/previous). */
export interface UserListPaginated<T> {
  count: number;
  num_pages: number;
  current_page: number;
  results: T[];
}

export interface DjangoApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  department: string | null;
  title: string | null;
  auth_source: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  // Izin fitur granular utk user NON-staff (lihat iclock/models.py::FeaturePermission
  // & dashboard Django "Kelola Izin User") -- staff/superuser SELALU true.
  // CATATAN: field ini SEMPAT HILANG dari sini (regresi tidak disengaja),
  // ketahuan saat build gagal di halaman portal -- sudah dikembalikan.
  can_transfer_finger: boolean;
  can_view_attendance_recap: boolean;
}

export interface MikrotikDhcpLease {
  id: string;
  address: string;
  'mac-address': string;
  server: string;
  status: 'bound' | 'waiting' | 'testing';
  'last-seen': string;
  'host-name'?: string;
  dynamic: 'true' | 'false';
  disabled: 'true' | 'false';
}

export type MikrotikFirewallChain = 'input' | 'forward' | 'output';
export type MikrotikFirewallAction = 'accept' | 'drop' | 'reject' | 'jump' | 'passthrough';

export interface MikrotikFirewallFilterRule {
  id: string;
  chain: MikrotikFirewallChain;
  action: MikrotikFirewallAction;
  'in-interface'?: string;
  'out-interface'?: string;
  'src-mac-address'?: string;
  'in-interface-list'?: string;
  'out-interface-list'?: string;
  protocol?: string;
  'dst-port'?: string;
  src?: string;
  comment?: string;
  bytes?: string;
  disabled?: 'true' | 'false';
}

export interface MikrotikNetwatchItem {
  id: string;
  host: string;
  status: 'up' | 'down' | 'waiting' | 'initializing';
  since: string;
  interval: string;
  timeout: string;
  comment?: string;
  disabled: 'true' | 'false';
  'up-script'?: string;
  'down-script'?: string;
}

// --- netmgmt: Active Directory & Zentyal LDAP -- bentuk data KONSISTEN
// (dirancang sengaja begitu di Django, lihat netmgmt/active_directory_view.py
// & netmgmt/zentyal_view.py) supaya BISA pakai komponen frontend yang SAMA
// utk keduanya (lihat components/netmgmt/directory-*.tsx), parameterized
// oleh source 'ad'|'zentyal', bukan bikin 2 set halaman terpisah.

export interface DirectoryUser {
  dn: string;
  username: string;
  display_name: string;
  email: string;
  // Cuma ADA di AD (userAccountControl decoded) -- undefined utk Zentyal.
  is_enabled?: boolean;
  // Cuma ADA di AD (lockoutTime decoded) -- TERKUNCI OTOMATIS krn salah
  // password berkali-kali, BEDA dari is_enabled (dinonaktifkan MANUAL).
  is_locked?: boolean;
  // ISO datetime (UTC) kapan akun terkunci -- null kalau tidak terkunci.
  locked_at?: string | null;
  // Cuma ADA di Zentyal (posixAccount) -- undefined utk AD.
  uid_number?: string;
  gid_number?: string;
  home_directory?: string;
}

export interface DirectoryGroup {
  dn: string;
  name: string;
  description: string;
  member_count: number;
  // Cuma ADA di Zentyal ('posix'|'distribution') -- undefined utk AD.
  kind?: 'posix' | 'distribution';
}

// --- Active Directory DNS -- lihat netmgmt/active_directory_dns_view.py & netmgmt/dns_codec.py
export type DnsZonePartition = 'forest' | 'domain' | 'legacy';
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'SRV' | 'TXT' | 'NS' | 'PTR';

export interface DnsZone {
  dn: string;
  name: string;
  partition: DnsZonePartition;
}

// `data` bentuknya beda per `type` -- lihat netmgmt/dns_codec.py utk field
// PERSIS per tipe (A/AAAA: address, CNAME/NS/PTR: target, MX: preference+exchange,
// SRV: priority+weight+port+target, TXT: text).
export interface DnsRecordData {
  address?: string;
  target?: string;
  preference?: number;
  exchange?: string;
  priority?: number;
  weight?: number;
  port?: number;
  text?: string;
}

export interface DnsRecordRow {
  node_dn: string;
  name: string;
  type: string; // DnsRecordType kalau `editable`, atau "TYPE<n>" kalau tipe asing/belum didukung
  ttl_seconds: number;
  data: DnsRecordData;
  raw_b64: string; // identitas UNIK 1 record spesifik (bisa ada >1 record nama+tipe sama dlm 1 node) -- wajib dikirim balik utk edit/hapus
  editable: boolean; // false utk tipe yg belum didukung ditulis (mis. SOA) -- tampilkan read-only saja
}

// --- Zentyal Mail API (Flask, Python 2.7, server TERPISAH) -- lihat
// netmgmt/zentyal_mail_view.py & test/zentyalmail_v2.py. BEDA dari
// DirectoryUser/DnsZone dkk (itu semua lewat LDAP) -- ini HTTP+JSON
// polos ke Flask app, TIDAK ada pagination bawaan (Flask kembalikan
// SEMUA hasil sekaligus), jadi halaman terkait TIDAK pakai
// RouterOSPaginationBar spt Mikrotik/AD/Zentyal LDAP.

export interface MailQueueItem {
  id: string;
  size: string;
  rawdate: string;
  sender: string;
  recipient: string;
  reason: string;
  status: "active" | "deferred";
}

export interface MailImapLogEntry {
  date: string;
  email: string;
  ip: string;
}

// BENTUK RESPONS dipaginasi Django (lihat netmgmt/zentyal_mail_view.py::
// ZentyalMailQueueView, pakai netmgmt/list_utils.py SAMA spt Mikrotik/AD/
// Zentyal LDAP) -- next/previous di sini NOMOR HALAMAN (bukan URL string
// spt Paginated<T> standar DRF), TAPI RouterOSPaginationBar toh tidak
// baca field ini (hitung sendiri dari count+pageSize).
//
// total_count/active_count/deferred_count: dihitung dari SELURUH queue
// SEBELUM dipaginasi/difilter -- SELALU angka GLOBAL apa pun halaman/
// pencarian yg sedang aktif (BEDA dari `count`, yang refleksikan HASIL
// filter/pencarian saat ini) -- dipakai indikator ringkasan di sebelah
// search bar.
export interface MailQueueResponse {
  count: number;
  page: number;
  results: MailQueueItem[];
  next: number | null;
  previous: number | null;
  imaplogs: MailImapLogEntry[];
  total_count: number;
  active_count: number;
  deferred_count: number;
}

export interface MailTodayLogEntry {
  date: string;
  qid: string;
  sender: string;
  total_recp: string | number;
  size: string;
}

export interface MailLogEntry {
  status: string;
  client_host_ip: string;
  from_address: string;
  relay: string;
  timestamp: string | null;
  client_host_name: string;
  event: string;
  message_size: string;
  qid: string;
  to_address: string;
  message: string;
  message_type: string;
  message_id: string;
}

export interface MailTransportRow {
  domain: string;
  target: string;
  status: "0" | "1";
}

export interface MailBlockedSenderRow {
  email: string;
  action: string;
  status: "0" | "1";
}

export interface MailAuthFailLogEntry {
  notes: string;
  date: string;
  ip: string;
  email?: string; // cuma ada di ImapLogs, tidak ada di SaslLogs
  count?: number; // cuma ada di SaslLogs (jumlah percobaan per IP), tidak ada di ImapLogs
}

export interface MailIpViaEmailRow {
  user: string;
  ip: string;
}

// --- VMware vSphere (vCenter 7.0 REST API lama, /rest/vcenter/...) --
// lihat src/lib/vsphere-client.ts & src/app/api/vsphere/[...path]/route.ts.
// Response asli vCenter dibungkus {"value": [...]} -- SUDAH DIBONGKAR di
// halaman Server Component (page.tsx), jadi tipe di sini cukup array isinya.

export type VsphereConnectionState = "CONNECTED" | "DISCONNECTED" | "NOT_RESPONDING";
export type VspherePowerState = "POWERED_ON" | "POWERED_OFF" | "SUSPENDED";

export interface VsphereHost {
  host: string; // id internal vCenter (mis. "host-21")
  name: string;
  connection_state: VsphereConnectionState;
  power_state: VspherePowerState;
}

export interface VsphereVm {
  vm: string; // id internal vCenter (mis. "vm-100")
  name: string;
  power_state: VspherePowerState;
  cpu_count: number;
  memory_size_MiB: number;
}

// --- Detail per-VM -- BEDA SUMBER dari VsphereVm di atas (yang dari
// REST API vCenter langsung, dipanggil Next.js). Detail ini dari Django
// (SOAP API/pyVmomi, lihat netmgmt/vmware_view.py) -- REST API vCenter
// perlu request TERPISAH per jenis detail (N+1), SOAP PropertyCollector
// bisa ambil semua field ini dlm 1 round-trip.
export interface VmwareDisk {
  label: string;
  capacity_gb: number;
  thin_provisioned: boolean | null;
  datastore_name: string | null;
}

export interface VmwareDatastore {
  name: string;
  type: string;
  capacity_gb: number;
  free_space_gb: number;
}

export interface VmwareVmDetail {
  vm: string;
  name: string;
  power_state: string;
  guest_full_name: string | null;
  guest_hostname: string | null;
  guest_ip_address: string | null;
  tools_status: string | null;
  tools_running_status: string | null;
  num_cpu: number | null;
  memory_mb: number | null;
  disks: VmwareDisk[];
  datastores: VmwareDatastore[];
}

// --- Cloudflare DNS -- lihat netmgmt/cloudflare_view.py

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
}

export type CloudflareRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  proxiable: boolean;
  priority: number | null;
}

// --- Data IT-Infra -- lihat netmgmt/itinfra_view.py & netmgmt/models.py::ITInfraEntry.
// `data` bentuknya BEBAS (dictionary key-value string) -- TIDAK ADA
// skema tetap per kategori, jadi cukup Record<string, string>.

export interface ITInfraCategory {
  id: number;
  name: string;
}

// Bentuk RINGKAS (list) -- SENGAJA TANPA field `data` (lihat catatan
// keamanan di netmgmt/itinfra_view.py -- password dkk TIDAK ikut
// terkirim di endpoint list, cuma di endpoint detail).
export interface ITInfraEntrySummary {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  notes: string;
  updated_at: string;
}

// Bentuk LENGKAP (detail 1 entry) -- BARU py field `data`.
export interface ITInfraEntryDetail extends ITInfraEntrySummary {
  data: Record<string, string>;
}

// --- Mobile Attendance (mclock) -- 5 submenu (Karyawan/Driver/Mitra/
// Kantin/Kantin Mitra Mobile), 1 API generik -- lihat
// mclock/mobile_attendance_api_view.py & mclock/sources.py.

export interface MobileAttendanceSource {
  slug: string;
  title: string;
}

export interface MobileAttendanceRow {
  Id: number;
  sn: string;
  nik: string;
  ttime: string;
  ctype: string;
  bProses: number;
}