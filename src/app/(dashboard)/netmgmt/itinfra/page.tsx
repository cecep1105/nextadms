import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, ITInfraCategory, ITInfraEntrySummary } from "@/types/api";
import { AddItInfraButton } from "./_components/add-itinfra-button";
import { AddCategoryDialog } from "./_components/add-category-dialog";
import { ItInfraActionsMenu } from "./_components/itinfra-actions-menu";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string; category?: string }>;
}

async function getCategories(): Promise<ITInfraCategory[]> {
  const data = await apiServerFetch<{ results: ITInfraCategory[] }>("/netmgmt/itinfra/categories/");
  return data.results;
}

async function getEntries(categoryId?: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<ITInfraEntrySummary>> {
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  return apiServerFetch<Paginated<ITInfraEntrySummary>>(`/netmgmt/itinfra/entries/?${params.toString()}`);
}

export default async function ItInfraPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);

  const [categories, data] = await Promise.all([
    getCategories(),
    getEntries(sp.category, sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size),
  ]);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Data IT-Infra"
        description="Registry data infrastruktur bebas -- langganan internet, VPS, domain, dll. Isi (password dkk) baru terlihat saat dibuka detail/edit."
        action={
          <div className="flex items-center gap-2">
            <AddCategoryDialog />
            <AddItInfraButton categories={categories} />
          </div>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / catatan / kategori" />
          <div className="flex flex-wrap gap-1.5">
            <Link
              href="/netmgmt/itinfra"
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${!sp.category ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              Semua
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/netmgmt/itinfra?category=${c.id}`}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${sp.category === String(c.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="category_name" label="Kategori" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama" /></TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="updated_at" label="Diperbarui" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {categories.length === 0 ? "Belum ada kategori -- buat kategori dulu sebelum menambah data." : "Tidak ada data ditemukan."}
              </TableCell></TableRow>
            ) : (
              data.results.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell><Badge variant="secondary">{entry.category_name}</Badge></TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={entry.notes}>{entry.notes || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(entry.updated_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell><ItInfraActionsMenu entry={entry} categories={categories} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(sp.page ?? "1")} />
      </Card>
    </div>
  );
}
