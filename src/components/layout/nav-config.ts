import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  LayoutDashboard, Users, Building2, Cpu, ClipboardList, Fingerprint,
  ScrollText, FileClock, Terminal, CalendarClock, MapPinned, Route,
  ToggleLeft, ScanFace, Smartphone, History, UserCircle, KeyRound, Network, Server, Router, Shield, Globe, Lock, HardDrive, Monitor,
} from "lucide-react";

import MailQueueIcon from "../icons/mailqueue";

export interface NavItem {
  title: string;
  /** Opsional -- item TANPA href jadi "folder" (dropdown bertingkat), tidak
   * navigasi ke mana pun sendiri, cuma buka/tutup `children`-nya (lihat
   * "Mikrotik"/"Mail Server (Zentyal)"/"Active Directory" di bawah, sub-menu
   * dari grup "Network Management"). */
  href?: string;
  icon: ComponentType<LucideProps>;
  /** Sub-item, BISA BERSARANG (item ini sendiri jadi collapsible di dalam
   * grup) -- lihat komponen Sidebar utk cara render bertingkatnya. */
  children?: NavItem[];
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
    // SEBELUMNYA "Network Management"/"Mail Server"/"Active Directory" adalah
    // 3 GRUP TERPISAH di level teratas -- sekarang digabung jadi 1 grup,
    // masing2 (Mikrotik/Mail Server/Active Directory) jadi SUB-MENU
    // bertingkat DI DALAMNYA (item tanpa href, py children -- lihat
    // NavItem.children di atas).
    label: "Network Management",
    icon: Router,
    items: [
      {
        title: "Mikrotik", icon: Server,
        children: [
          { title: "DHCP Leases", href: "/netmgmt/mikrotik/dhcp", icon: Server },
          { title: "Firewall Filter", href: "/netmgmt/mikrotik/fwfilter", icon: Shield },
          { title: "Netwatch", href: "/netmgmt/mikrotik/netwatch", icon: Network },
        ],
      },
      {
        title: "Mail Server (Zentyal)", icon: MailQueueIcon,
        children: [
          { title: "Mail Queue", href: "/netmgmt/zentyal/mail-queue", icon: MailQueueIcon },
          { title: "Today's Log", href: "/netmgmt/zentyal/today-log", icon: FileClock },
          { title: "Transport Map", href: "/netmgmt/zentyal/transport", icon: Route },
          { title: "Blocked Senders", href: "/netmgmt/zentyal/block-senders", icon: Shield },
          { title: "IMAP Logs", href: "/netmgmt/zentyal/imap-logs", icon: ScrollText },
          { title: "SASL Logs", href: "/netmgmt/zentyal/sasl-logs", icon: ScrollText },
          { title: "Users", href: "/netmgmt/zentyal/users", icon: Users },
          { title: "Groups", href: "/netmgmt/zentyal/groups", icon: Users },
        ],
      },
      {
        title: "Active Directory", icon: Server,
        children: [
          { title: "Users", href: "/netmgmt/active-directory/users", icon: Users },
          { title: "Locked Users", href: "/netmgmt/active-directory/locked-users", icon: Lock },
          { title: "Groups", href: "/netmgmt/active-directory/groups", icon: Network },
          { title: "DNS Zones", href: "/netmgmt/active-directory/dns", icon: Globe },
        ],
      },
      {
        title: "VMware", icon: HardDrive,
        children: [
          { title: "Host", href: "/netmgmt/vmware/hosts", icon: Server },
          { title: "VM Guest", href: "/netmgmt/vmware/vms", icon: Monitor },
        ],
      },
      { title: "Cloudflare DNS", href: "/netmgmt/cloudflare/zones", icon: Globe },
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
