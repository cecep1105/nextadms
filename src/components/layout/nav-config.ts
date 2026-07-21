import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, Building2, Cpu, ClipboardList, Fingerprint,
  ScrollText, FileClock, Terminal, CalendarClock, MapPinned, Route,
  ToggleLeft, ScanFace, Smartphone, History,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Utama",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Akses",
    items: [{ title: "Manajemen User", href: "/users", icon: Users }],
  },
  {
    label: "iClock — Device & Absensi",
    items: [
      { title: "Pool / Department", href: "/iclock/departments", icon: Building2 },
      { title: "Active Device", href: "/iclock/active-devices", icon: Cpu },
      { title: "Registered Device", href: "/iclock/registered-devices", icon: ClipboardList },
      { title: "Employee", href: "/iclock/employees", icon: Fingerprint },
      { title: "Transaction", href: "/iclock/transactions", icon: ScrollText },
      { title: "Attendance Recap", href: "/iclock/attendance-recap", icon: CalendarClock },
      { title: "Operation Log", href: "/iclock/operation-logs", icon: FileClock },
      { title: "Device Log", href: "/iclock/device-logs", icon: History },
      { title: "Device Command", href: "/iclock/device-commands", icon: Terminal },
    ],
  },
  {
    label: "Mobile Attendance",
    items: [
      { title: "Mobile Pool", href: "/mclock/mobile-pools", icon: MapPinned },
      { title: "Pool Location (Geofence)", href: "/mclock/mobile-pool-locations", icon: Route },
      { title: "Pool Device Function", href: "/mclock/pool-device-functions", icon: ToggleLeft },
      { title: "Log Absensi GPS", href: "/mattendance/logs", icon: Smartphone },
      { title: "Face Profile", href: "/mattendance/face-profiles", icon: ScanFace },
    ],
  },
];
