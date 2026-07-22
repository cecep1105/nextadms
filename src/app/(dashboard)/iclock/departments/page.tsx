import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, Department } from "@/types/api";
import { DepartmentFormDialog } from "./_components/department-form-dialog";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/departments";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; ordering?: string };
}) {
  const page = searchParams.page ?? "1";
  const search = searchParams.q ?? "";
  const ordering = searchParams.ordering ?? "";
  const query = new URLSearchParams({ page });
  if (search) query.set("q", search);
  if (ordering) query.set("ordering", ordering);

  const data = await apiServerFetch<Paginated<Department>>(`/iclock/department/?${query.toString()}`);

  return (
    <div>
      <PageHeader
        title="Pool / Department"
        description="Pengelompokan lokasi/departemen untuk device & employee."
        action={<DepartmentFormDialog mode="create" />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari nama pool..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="Pool ID" sortKey="DeptID" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Nama Pool" sortKey="DeptName" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Net ID</TableHead>
              <TableHead>Router</TableHead>
              <TableHead>Subnet</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell></TableRow>
            ) : (
              data.results.map((dept) => (
                <TableRow key={dept.DeptID}>
                  <TableCell className="font-mono">{dept.DeptID}</TableCell>
                  <TableCell className="font-medium">{dept.DeptName}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.NetID}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{dept.DeptRouter}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{dept.DeptSubnet}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <DepartmentFormDialog mode="edit" department={dept} />
                      <DeleteConfirmButton endpoint={`/iclock/department/${dept.DeptID}/`} label={`Pool '${dept.DeptName}'`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar count={data.count} pageSize={PAGE_SIZE} currentPage={Number(page)} basePath={BASE_PATH} searchParams={{ q: search, ordering }} />
      </Card>
    </div>
  );
}
