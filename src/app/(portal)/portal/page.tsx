import Link from "next/link";
import { UserCircle, KeyRound, Fingerprint, CalendarClock, UtensilsCrossed, Truck, Router, ShieldCheck, Radar, Users, LockKeyhole, Globe, UsersRound, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiServerFetch } from "@/lib/api-server";
import type { DjangoApiUser } from "@/types/api";

function ActionCard({
  href, icon: Icon, title, description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function PortalHomePage() {
  const user = await apiServerFetch<DjangoApiUser>("/me/");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Halo, {user.full_name?.trim() || user.username}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilih menu di bawah untuk melanjutkan.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <ActionCard
          href="/portal/profile"
          icon={UserCircle}
          title="Profil Saya"
          description="Lihat & ubah informasi akun Anda."
        />
        <ActionCard
          href="/portal/profile/password"
          icon={KeyRound}
          title="Ganti Password"
          description="Perbarui password login Anda."
        />
        {user.can_transfer_finger && (
          <ActionCard
            href="/portal/transfer-finger"
            icon={Fingerprint}
            title="Transfer Data Finger"
            description="Pindahkan data fingerprint karyawan ke pool/device tujuan."
          />
        )}
        {user.can_view_attendance_recap && (
          <ActionCard
            href="/portal/attendance-recap?recap_type=all"
            icon={CalendarClock}
            title="Rekap Absensi - All"
            description="Lihat rekap kehadiran seluruh karyawan per tanggal."
          />
        )}
        {user.can_view_attendance_recap_kantin && (
          <ActionCard
            href="/portal/attendance-recap?recap_type=kantin"
            icon={UtensilsCrossed}
            title="Rekap Absensi - Kantin"
            description="Rekap kehadiran khusus device/lokasi ber-function KANTIN."
          />
        )}
        {user.can_view_attendance_recap_driver && (
          <ActionCard
            href="/portal/attendance-recap?recap_type=driver"
            icon={Truck}
            title="Rekap Absensi - Driver"
            description="Rekap kehadiran khusus karyawan berkode function Driver."
          />
        )}
        {user.can_view_dhcp_lease && (
          <ActionCard
            href="/portal/dhcp-lease"
            icon={Router}
            title="DHCP Lease"
            description="Lihat daftar IP yang sedang disewa device di jaringan."
          />
        )}
        {user.can_view_fwfilter && (
          <ActionCard
            href="/portal/fwfilter"
            icon={ShieldCheck}
            title="Firewall Filter"
            description="Lihat rule firewall & berikan akses internet untuk device baru."
          />
        )}
        {user.can_view_netwatch && (
          <ActionCard
            href="/portal/netwatch"
            icon={Radar}
            title="Netwatch"
            description="Pantau status host & kelola host yang dipantau."
          />
        )}
        {user.can_view_ad_users && (
          <ActionCard
            href="/portal/ad-users"
            icon={Users}
            title="Active Directory - Users"
            description="Lihat daftar user, aktif/nonaktifkan akun, reset password."
          />
        )}
        {user.can_view_ad_locked_users && (
          <ActionCard
            href="/portal/ad-locked-users"
            icon={LockKeyhole}
            title="Active Directory - Locked Users"
            description="Lihat & buka kunci akun yang terkunci otomatis."
          />
        )}
        {user.can_view_ad_dns && (
          <ActionCard
            href="/portal/ad-dns"
            icon={Globe}
            title="Active Directory - DNS"
            description="Lihat zone & record DNS yang terdaftar."
          />
        )}
        {user.can_view_ad_groups && (
          <ActionCard
            href="/portal/ad-groups"
            icon={UsersRound}
            title="Active Directory - Groups"
            description="Lihat daftar group & jumlah anggotanya."
          />
        )}
      </div>
    </div>
  );
}
