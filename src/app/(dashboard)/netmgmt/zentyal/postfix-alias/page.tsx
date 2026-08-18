import { PageHeader } from "@/components/shared/page-header";
import { RouterOSSearchBar } from "@/components/netmgmt/routeros-search-bar";
import { RouterOSPaginationBar } from "@/components/netmgmt/routeros-pagination-bar";
import { RouterOSSortableHeader } from "@/components/netmgmt/routeros-sortable-header";
import { AddZentyalUserDialog } from "@/components/netmgmt/add-zentyal-user-dialog";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, DirectoryUser, MailPostfixAlias } from "@/types/api";
import { PostfixAliasSelector } from "./_components/postfix-alias-selector";
import { ListTooltip } from "@/components/shared/list-tooltip";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ source?: string; sortBy?: string; sortDir?: string; page?: string; q?: string; page_size?: string }>;
}

async function getZentyalPostfixAlias(source?: string, sortBy?: string, sortDir?: string, page?: string, q?: string, page_size?: string): Promise<Paginated<MailPostfixAlias>> {
  const params = new URLSearchParams();
  if (sortBy) params.set("_sort_by", sortBy);
  if (sortDir) params.set("_order", sortDir);
  if (q) params.set("_q", q);
  if (page) params.set("_page", page);
  if (page_size) params.set("_limit", page_size);
  params.set("_search_fields", "username,display_name,email");

  return apiServerFetch<Paginated<MailPostfixAlias>>(`/netmgmt/zentyal/postfix-alias/${source}/?${params.toString()}`);
}

export default async function ZentyalPostfixAliasPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const currentAlias = sp.source ?? "recipient_bcc"

  const pageSize = Number(sp.page_size ?? PAGE_SIZE);
  const data = await getZentyalPostfixAlias(currentAlias,sp.sortBy, sp.sortDir, sp.page, sp.q, sp.page_size);

  return (
    <div>
      <PageHeader title="NetMgmt / Zentyal /Postfix Alias" description="Daftar Email Alias" action={<AddZentyalUserDialog />} />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <RouterOSSearchBar placeholder="Cari uid / mail / maildrop" />
          <PostfixAliasSelector 
            sources={["mailalias", "recipient_bcc", "sender_bcc"]}
            current={currentAlias}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><RouterOSSortableHeader columnKey="uid" label="UID" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="mail" label="Email Alias" /></TableHead>
              <TableHead><RouterOSSortableHeader columnKey="maildrop" label="Email Asli" /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((alias) => (
                <TableRow key={alias.uid}>
                  <TableCell className="text-muted-foreground">{alias.uid}</TableCell>
                  <TableCell className="text-muted-foreground">{alias.mail}</TableCell>
                  <TableCell className="text-muted-foreground"><ListTooltip items={alias.maildrop}/></TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {/* <ZentyalUserActionsMenu userDn={user.dn} userLabel={user.display_name || user.username} isEnabled={user.is_enabled ?? true} /> */}
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
