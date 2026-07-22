import { Smartphone, Fingerprint as FingerprintIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SortableHeader } from "@/components/shared/sortable-header";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { Paginated, Employee, Department, ActiveDevice } from "@/types/api";
import { EmployeeFormDialog } from "./_components/employee-form-dialog";
import { SetAdminButton } from "./_components/set-admin-button";
import { TransferFingerDialog } from "./_components/transfer-finger-dialog";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/employees";

export default async function EmployeesPage({
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

  const [employeesData, departmentsData, devicesData] = await Promise.all([
    apiServerFetch<Paginated<Employee>>(`/iclock/device-user/?${query.toString()}`),
    apiServerFetch<Paginated<Department>>("/iclock/department/?page_size=200"),
    apiServerFetch<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"),
  ]);

  return (
    <div>
      <PageHeader
        title="Employee"
        description="Karyawan/pengguna yang terdaftar di mesin fingerprint & mobile attendance."
        action={<EmployeeFormDialog mode="create" departments={departmentsData.results} />}
      />

      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari PIN / Nama..." />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortableHeader label="PIN" sortKey="PIN" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead><SortableHeader label="Nama" sortKey="EName" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Last Pool</TableHead>
              <TableHead>Last Device</TableHead>
              <TableHead><SortableHeader label="Last Seen" sortKey="UTime" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesData.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Tidak ada employee ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              employeesData.results.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono">{emp.PIN}</TableCell>
                  <TableCell className="font-medium">{emp.EName?.trim() || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.DeptName ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.LastPool ?? "-"}</TableCell>
                  <TableCell>
                    {emp.LastDevice === "Mobile" ? (
                      <Badge variant="default"><Smartphone className="mr-1 h-2.5 w-2.5" /> Mobile</Badge>
                    ) : emp.LastDevice ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <FingerprintIcon className="h-3 w-3" /> {emp.LastDevice}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-tabular text-muted-foreground">
                    {emp.UTime ? new Date(emp.UTime).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <EmployeeFormDialog mode="edit" employee={emp} departments={departmentsData.results} />
                      <SetAdminButton employeeId={emp.id} privilege={emp.Privilege} />
                      <TransferFingerDialog employee={emp} departments={departmentsData.results} devices={devicesData.results} />
                      <DeleteConfirmButton
                        endpoint={`/iclock/device-user/${emp.id}/`}
                        label={`Employee '${emp.PIN} — ${emp.EName?.trim() || "tanpa nama"}'`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationBar
          count={employeesData.count}
          pageSize={PAGE_SIZE}
          currentPage={Number(page)}
          basePath={BASE_PATH}
          searchParams={{ q: search, ordering }}
        />
      </Card>
    </div>
  );
}
