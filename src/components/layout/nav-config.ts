import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  LayoutDashboard, Users, Building2, Cpu, ClipboardList, Fingerprint,
  ScrollText, FileClock, Terminal, CalendarClock, MapPinned, Route,
  ToggleLeft, ScanFace, Smartphone, History, UserCircle, KeyRound, Network, Server, Mail, Router,Shield,
} from "lucide-react";

import MailQueueIcon from "../icons/mailqueue";

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<LucideProps>;
}


export interface NavGroup {
  label: string;
  /** Ikon GRUP -- cuma dipakai kalau grup ini jadi dropdown collapsible (items.length > 1). */
  icon?: ComponentType<LucideProps>;
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
    icon: Cpu,
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
    icon: Smartphone,
    items: [
      { title: "Mobile Pool", href: "/mclock/mobile-pools", icon: MapPinned },
      { title: "Pool Location (Geofence)", href: "/mclock/mobile-pool-locations", icon: Route },
      { title: "Pool Device Function", href: "/mclock/pool-device-functions", icon: ToggleLeft },
      { title: "Log Absensi GPS", href: "/mattendance/logs", icon: Smartphone },
      { title: "Face Profile", href: "/mattendance/face-profiles", icon: ScanFace },
    ],
  },
  {
    label: "Network Management",
    icon: Router,
    items: [ 
      { title: "Mikrotik DHCP Leases", href: "/netmgmt/mikrotik/dhcp", icon: Server },
      { title: "Mikrotik Firewall Filter", href: "/netmgmt/mikrotik/fwfilter", icon: Shield },
      { title: "Mikrotik Netwatch", href: "/netmgmt/mikrotik/netwatch", icon: Network },      
    ],
  },
  {
    label: "Mail Server",
    icon: Server,
    items: [
      { title: "Mail Users", href: "/netmgmt/mail/users", icon: Users },
      { title: "Mail Queue", href: "/netmgmt/mail/queue", icon: MailQueueIcon },
      { title: "Postfix Transport", href: "/netmgmt/mail/transport", icon: Network },      
    ],
  },
  {
    label: "Active Directory",
    icon: Server,
    items: [
      { title: "AD Users", href: "/netmon/mail/users", icon: Users },
      { title: "AD Groups", href: "/netmon/mail/queue", icon: MailQueueIcon },
      { title: "AD Lock", href: "/netmon/mail/transport", icon: Network },      
    ],
  },

];

/**
 * Nav utk akun BUKAN staff/superuser (cuma login biasa, tanpa akses
 * dashboard admin) -- lihat middleware.ts, akun begini di-redirect ke
 * /profile & TIDAK bisa akses halaman lain sama sekali. Sidebar-nya JUGA
 * cuma nampilin ini (bukan seluruh `navGroups` di atas yang isinya
 * semua akan 403 kalau diklik).
 */
export const nonStaffNavGroups: NavGroup[] = [
  {
    label: "Akun Saya",
    items: [
      { title: "Profil Saya", href: "/profile", icon: UserCircle },
      { title: "Ganti Password", href: "/profile/password", icon: KeyRound },
    ],
  },
];
