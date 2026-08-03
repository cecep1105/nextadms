import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { IDCardListItem, IDCardStatus } from "@/types/api";
import { DeleteCardRowButton } from "./_components/delete-card-row-button";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

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

export default async function IdCardListPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; card_type?: string };
}) {
  const data = await getCards(searchParams.page, searchParams.q, searchParams.status, searchParams.card_type);

  return (
    <div>
      <PageHeader title="Daftar ID Card" description="Semua kartu yang sudah digenerate, beserta status cetaknya." />
      <Card>
        <div className="border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / PIN / no. identitas" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>PIN/No. Identitas</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Belum ada kartu.</TableCell></TableRow>
            ) : (
              data.results.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <Link href={`/idcard/cards/${card.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.card_image} alt={card.holder_name} className="h-16 w-11 rounded border border-border object-cover" />
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{card.card_type_label}</Badge></TableCell>
                  <TableCell>
                    <Link href={`/idcard/cards/${card.id}`} className="font-medium hover:text-primary hover:underline">{card.holder_name}</Link>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{card.holder_identifier || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{card.template_name}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[card.status]}>{card.status_label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(card.generated_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteCardRowButton cardId={card.id} holderName={card.holder_name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
