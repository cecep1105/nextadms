import Link from "next/link";
import { UserCircle, KeyRound, Fingerprint, CalendarClock, type LucideIcon } from "lucide-react";
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            href="/portal/attendance-recap"
            icon={CalendarClock}
            title="Rekap Absensi"
            description="Lihat rekap kehadiran karyawan per tanggal."
          />
        )}
      </div>
    </div>
  );
}
