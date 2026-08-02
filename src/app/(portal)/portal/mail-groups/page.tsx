import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, DirectoryGroup } from "@/types/api";

// VIEW-ONLY (SENGAJA, beda dari halaman staff) -- tambah group baru &
// kelola keanggotaan SENGAJA dikecualikan dari cakupan izin portal
// can_view_zentyal_groups (lihat netmgmt/zentyal_view.py::
// ZentyalGroupCreateView/ZentyalGroupMembershipView, permission-nya
// TETAP staff-only).
export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

async function getZentyalGroups(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<DirectoryGroup>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  params.set("_search_fields", "name,description");
  return apiServerFetch<Paginated<DirectoryGroup>>(`/netmgmt/zentyal/groups/?${params.toString()}`);
}

export default async function PortalMailGroupsPage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getZentyalGroups(searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="Mail Server - Groups"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari nama / deskripsi group" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="name" label="Nama Group" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="description" label="Deskripsi" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="member_count" label="Jumlah Member" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada group ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((group) => (
                <TableRow key={group.dn}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{group.member_count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <RouterOSPaginationBar count={data.count} pageSize={pageSize} currentPage={Number(searchParams.page ?? "1")} />
      </Card>
    </div>
  );
}
