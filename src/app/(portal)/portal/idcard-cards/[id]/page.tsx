import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiServerFetch } from "@/lib/api-server";
import { resolveMediaUrl } from "@/lib/media-url";
import type { IDCardDetail, IDCardStatus } from "@/types/api";
import { ChangeStatusButton } from "./_components/change-status-button";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<IDCardStatus, "success" | "secondary" | "destructive" | "warning"> = {
  belum_cetak: "secondary", sudah_cetak: "success", hilang: "destructive", cetak_ulang: "warning",
};

export default async function PortalIdCardDetailPage({ params }: { params: { id: string } }) {
  const card = await apiServerFetch<IDCardDetail>(`/idcard/cards/${params.id}/`);

  return (
    <div>
      <PageHeader
        title={card.holder_name}
        description={
          <Link href="/portal/idcard-cards" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Daftar Kartu
          </Link>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/idcard-print/${card.id}`} target="_blank" rel="noopener noreferrer">
                <Printer className="h-3.5 w-3.5" /> Cetak Kartu
              </a>
            </Button>
            <ChangeStatusButton cardId={card.id} currentStatus={card.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 p-4 lg:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveMediaUrl(card.card_image)} alt={card.holder_name} className="w-full max-w-[220px] rounded-md border border-border shadow-sm" />
          <div className="w-full space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Jenis</span><Badge variant="secondary">{card.card_type_label}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PIN/No. Identitas</span><span className="font-mono">{card.holder_identifier || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Template</span><span>{card.template_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sumber Foto</span><span className="capitalize">{card.photo_source}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status Saat Ini</span><Badge variant={STATUS_VARIANT[card.status]}>{card.status_label}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Dibuat</span><span>{new Date(card.generated_at).toLocaleString("id-ID")}</span></div>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Riwayat Status</h3>
          {card.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
          ) : (
            <div className="space-y-3">
              {card.logs.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <Badge variant={STATUS_VARIANT[log.status]} className="mt-0.5 shrink-0">{log.status_label}</Badge>
                  <div className="min-w-0 flex-1">
                    {log.notes && <p className="text-sm">{log.notes}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.changed_at).toLocaleString("id-ID")}
                      {log.changed_by_username && <> — oleh {log.changed_by_username}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
