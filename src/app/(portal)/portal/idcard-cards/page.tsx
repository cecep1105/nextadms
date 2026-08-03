import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiServerFetch } from "@/lib/api-server";
import { resolveMediaUrl } from "@/lib/media-url";
import type { IDCardListItem, IDCardStatus } from "@/types/api";

// TAMPILAN GRID VISUAL (bukan tabel spt versi staff) -- SENGAJA, krn
// user yang akses menu portal ini yang akan MEMANAGE kartu2 tersebut
// sehari-hari (lebih intuitif lihat kartu sbg GAMBAR yg dikenali
// sekilas, drpd baris data teknis).
export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

const STATUS_VARIANT: Record<IDCardStatus, "success" | "secondary" | "destructive" | "warning"> = {
  belum_cetak: "secondary", sudah_cetak: "success", hilang: "destructive", cetak_ulang: "warning",
};

async function getCards(page?: string, q?: string, status?: string, cardType?: string): Promise<{ count: number; page: number; results: IDCardListItem[] }> {
  const params = new URLSearchParams();
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (status) params.set("status", status);
  if (cardType) params.set("card_type", cardType);
  params.set("_limit", String(PAGE_SIZE));
  return apiServerFetch(`/idcard/cards/?${params.toString()}`);
}

export default async function PortalIdCardListPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; card_type?: string };
}) {
  const data = await getCards(searchParams.page, searchParams.q, searchParams.status, searchParams.card_type);

  return (
    <div>
      <PageHeader
        title="Daftar ID Card"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />

      <div className="mb-4">
        <RouterOSSearchBar placeholder="Cari nama / PIN / no. identitas" />
      </div>

      {data.results.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">Belum ada kartu.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.results.map((card) => (
            <Link key={card.id} href={`/portal/idcard-cards/${card.id}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveMediaUrl(card.card_image)} alt={card.holder_name} className="aspect-[54/86] w-full object-cover" />
                <div className="space-y-1 p-2.5">
                  <p className="truncate text-sm font-medium">{card.holder_name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{card.holder_identifier || "-"}</p>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <Badge variant="secondary" className="text-[10px]">{card.card_type_label}</Badge>
                    <Badge variant={STATUS_VARIANT[card.status]} className="text-[10px]">{card.status_label}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <RouterOSPaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(searchParams.page ?? "1")} />
      </div>
    </div>
  );
}
