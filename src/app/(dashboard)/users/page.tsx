import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import { auth } from "@/lib/auth";
import type { UserListPaginated, DjangoApiUser } from "@/types/api";
import { UserFormDialog } from "./_components/user-form-dialog";
import { ResetPasswordDialog } from "./_components/reset-password-dialog";
import { ToggleActiveButton, SetStaffButton } from "./_components/user-actions";

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);

  const [data, session] = await Promise.all([
    apiServerFetch<UserListPaginated<DjangoApiUser>>(`/users/?${query.toString()}`),
    auth(),
  ]);
  const isSuperuser = session?.user?.is_superuser ?? false;
  const currentUserId = session?.user?.id;

  return (
    <div>
      <PageHeader
        title="Manajemen User"
        description="Kelola akun staff yang punya akses ke dashboard ini (LDAP & lokal)."
        action={<UserFormDialog mode="create" isSuperuser={isSuperuser} />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari username / nama / email..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sumber Auth</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                <TableRow key={u.id}>
                  <TableCell className="font-mono font-medium">{u.username}</TableCell>
                  <TableCell>{u.full_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.auth_source === "ldap" ? "default" : "secondary"}>{u.auth_source}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.department || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}
                      {u.is_staff && <Badge variant="default">Staff</Badge>}
                      {u.is_superuser && <Badge variant="warning">Superuser</Badge>}
                      {u.must_change_password && <Badge variant="outline">Wajib ganti pw</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <UserFormDialog mode="edit" user={u} />
                      {u.auth_source === "local" && <ResetPasswordDialog userId={u.id} username={u.username} />}
                      <ToggleActiveButton
                        userId={u.id} isActive={u.is_active}
                        disabled={isSelf} disabledReason={isSelf ? "Tidak dapat mengubah status akun sendiri" : undefined}
                      />
                      {isSuperuser && (
                        <SetStaffButton
                          userId={u.id} isStaff={u.is_staff}
                          disabled={isSelf} disabledReason={isSelf ? "Tidak dapat mengubah role sendiri" : undefined}
                        />
                      )}
                      {/* Hapus user CUMA boleh superuser (accounts/services.py::delete_user), TIDAK CUKUP staff biasa -- sebelumnya cuma cek target bukan superuser, jadi staff non-superuser bisa klik & dapat 403 tanpa penjelasan. */}
                      {isSuperuser && !u.is_superuser && (
                        <DeleteConfirmButton
                          endpoint={`/users/${u.id}/`} label={`User '${u.username}'`}
                          disabled={isSelf} disabledReason={isSelf ? "Tidak dapat menghapus akun sendiri" : undefined}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={data.current_page} basePath="/users" searchParams={{ q: search }} />
      </Card>
    </div>
  );
}
