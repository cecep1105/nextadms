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
import type { Paginated, FaceProfile } from "@/types/api";
import { ToggleLockButton } from "./_components/toggle-lock-button";

const PAGE_SIZE = 20;

export default async function FaceProfilesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);

  const data = await apiServerFetch<Paginated<FaceProfile>>(`/mattendance/admin/face-profiles/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Face Profile"
        description='Pengambilan wajah untuk mobile attendance -- "hanya dilakukan sekali" per employee, admin bisa buka kunci untuk enrollment ulang.'
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari PIN..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PIN</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Didaftarkan</TableHead>
              <TableHead>Diperbarui</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada face profile terdaftar.</TableCell></TableRow>
            ) : (
              data.results.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-mono">{profile.pin}</TableCell>
                  <TableCell className="font-medium">{profile.employee_name?.trim() || "-"}</TableCell>
                  <TableCell>
                    {profile.is_locked ? (
                      <Badge variant="warning">🔒 Terkunci</Badge>
                    ) : (
                      <Badge variant="secondary">Belum dikunci</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(profile.enrolled_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(profile.updated_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <ToggleLockButton id={profile.id} isLocked={profile.is_locked} />
                      <DeleteConfirmButton endpoint={`/mattendance/admin/face-profiles/${profile.id}/`} label={`Face Profile '${profile.pin} — ${profile.employee_name || "tanpa nama"}'`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath="/mattendance/face-profiles" searchParams={{ q: search }} />
      </Card>
    </div>
  );
}
