import { Cpu, Fingerprint, ScrollText, ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiServerFetch, ApiError } from "@/lib/api-server";
import type { Paginated, ActiveDevice, Employee, Transaction, RegisteredDevice } from "@/types/api";

async function safeCount(path: string): Promise<number | null> {
  try {
    const data = await apiServerFetch<Paginated<unknown>>(path);
    return data.count;
  } catch (err) {
    if (err instanceof ApiError) return null;
    throw err;
  }
}

function StatCard({
  title, value, icon: Icon, href, hint,
}: {
  title: string; value: number | null; icon: typeof Cpu; href: string; hint: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-tabular text-2xl font-semibold tracking-tight">
              {value === null ? "—" : value.toLocaleString("id-ID")}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardHomePage() {
  const [deviceCount, employeeCount, transactionCount, registeredCount] = await Promise.all([
    safeCount("/iclock/active-device/"),
    safeCount("/iclock/device-user/"),
    safeCount("/iclock/transaction/"),
    safeCount("/iclock/registered-device/"),
  ]);

  let recentTransactions: Transaction[] = [];
  try {
    const data = await apiServerFetch<Paginated<Transaction>>("/iclock/transaction/?page=1");
    recentTransactions = data.results.slice(0, 8);
  } catch {
    /* biarkan kosong -- kartu tetap tampil, cuma tabel recent yg tidak muncul */
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ringkasan infrastruktur device fingerprint dan aktivitas absensi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Active Device" value={deviceCount} icon={Cpu} href="/iclock/active-devices" hint="Device fingerprint terhubung" />
        <StatCard title="Employee" value={employeeCount} icon={Fingerprint} href="/iclock/employees" hint="Karyawan terdaftar" />
        <StatCard title="Transaction" value={transactionCount} icon={ScrollText} href="/iclock/transactions" hint="Total riwayat absensi" />
        <StatCard title="Registered Device" value={registeredCount} icon={ClipboardList} href="/iclock/registered-devices" hint="Menunggu aktivasi Pool" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Belum ada data transaksi.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.EmployeeName || t.EmployeePIN}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{t.SN}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p className="font-tabular">{new Date(t.TTime).toLocaleString("id-ID")}</p>
                    <p>{t.StateDisplay}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
