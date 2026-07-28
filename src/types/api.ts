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