import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { UnlockUserButton } from "@/components/netmgmt/unlock-user-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Paginated, DirectoryUser } from "@/types/api";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

async function getLockedUsers(sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<DirectoryUser>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  params.set("_search_fields", "username,display_name,email");
  return apiServerFetch<Paginated<DirectoryUser>>(`/netmgmt/ad/users/locked/?${params.toString()}`);
}

export default async function PortalAdLockedUsersPage({
  searchParams,
}: {
  searchParams: { sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string };
}) {
  const pageSize = Number(searchParams.page_size ?? PAGE_SIZE);
  const data = await getLockedUsers(searchParams.sortBy, searchParams.sortDir, searchParams.page, searchParams.q, searchParams.page_size);

  return (
    <div>
      <PageHeader
        title="Active Directory - Locked Users"
        description={
          <Link href="/portal" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Menu
          </Link>
        }
      />
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
              <TableHead>Status</TableHead>
              <TableHead><RouterOSSortableHeader columnKey="locked_at" label="Terkunci Sejak" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada user yang terkunci saat ini.</TableCell></TableRow>
            ) : (
              data.results.map((user) => (
                <TableRow key={user.dn}>
                  <TableCell className="font-mono">{user.username}</TableCell>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell><Badge variant="destructive">Terkunci</Badge></TableCell>
                  <TableCell className="text-muted-foreground" title={user.locked_at ?? ""}>{formatRelativeTime(user.locked_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <UnlockUserButton userDn={user.dn} userLabel={user.display_name || user.username} />
                    </div>
                  </TableCell>
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
