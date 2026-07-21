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
  user: number;
  username: string;
  PoolID: string | null;
  PoolName: string | null;
  check_type: string;
  check_type_display: string;
  latitude: string;
  longitude: string;
  timestamp: string;
  location_verified: boolean;
  face_verified: boolean;
  face_distance: number | null;
  Function: string | null;
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
  pin: string;
  name: string;
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
}
