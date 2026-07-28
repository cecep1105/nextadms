import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { ManageMembersButton } from "@/components/netmgmt/manage-members-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, DirectoryGroup } from "@/types/api";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

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

export default async function ZentyalGroupsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getZentyalGroups(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader
        title="NetMgmt / Zentyal / Groups"
        description={
          <>
            Daftar group Zentyal LDAP (posix &amp; distribution/mailing-list digabung) &amp; kelola keanggotaannya.{" "}
            <span className="text-[11px]">
              Badge <Badge variant="secondary" className="mx-0.5 align-middle">posix</Badge> = group keamanan biasa,{" "}
              <Badge variant="default" className="mx-0.5 align-middle">distribution</Badge> = mailing list.
            </span>
          </>
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
              <TableHead>Jenis</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="description" label="Deskripsi" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="member_count" label="Jumlah Member" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada group ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((group) => (
                <TableRow key={group.dn}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {group.kind === "distribution" ? <Badge variant="default">distribution</Badge> : <Badge variant="secondary">posix</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{group.member_count}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ManageMembersButton source="zentyal" groupDn={group.dn} groupName={group.name} />
                    </div>
                  </TableCell>
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
