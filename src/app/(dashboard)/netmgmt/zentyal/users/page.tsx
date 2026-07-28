import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { ResetPasswordButton } from "@/components/netmgmt/reset-password-button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, DirectoryUser } from "@/types/api";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getZentyalUsers(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<DirectoryUser>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  params.set("_search_fields", "username,display_name,email");
  return apiServerFetch<Paginated<DirectoryUser>>(`/netmgmt/zentyal/users/?${params.toString()}`);
}

export default async function ZentyalUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getZentyalUsers(sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal / Users" description="Daftar user mail server Zentyal (LDAP)" />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari username / nama / email" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="username" label="Username" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="display_name" label="Nama" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="email" label="Email" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="uid_number" label="UID" /></TableHead>
              <TableHead>Home Directory</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((user) => (
                <TableRow key={user.dn}>
                  <TableCell className="font-mono">{user.username}</TableCell>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{user.uid_number}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{user.home_directory || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ResetPasswordButton source="zentyal" userDn={user.dn} userLabel={user.display_name || user.username} />
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
