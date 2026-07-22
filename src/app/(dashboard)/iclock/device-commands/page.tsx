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
import type { Paginated, DeviceCommand, ActiveDevice } from "@/types/api";
import { SendCommandDialog } from "./_components/send-command-dialog";

const PAGE_SIZE = 20;
const BASE_PATH = "/iclock/device-commands";

function CommandStatusBadge({ cmd }: { cmd: DeviceCommand }) {
  if (!cmd.CmdOverTime) return <Badge variant="warning">Pending</Badge>;
  if (cmd.CmdReturn === "0") return <Badge variant="success">Sukses</Badge>;
  return <Badge variant="destructive">Gagal ({cmd.CmdReturn})</Badge>;
}

export default async function DeviceCommandsPage({
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

  const [data, devicesData] = await Promise.all([
    apiServerFetch<Paginated<DeviceCommand>>(`/iclock/device-command/?${query.toString()}`),
    apiServerFetch<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"),
  ]);

  return (
    <div>
      <PageHeader
        title="Device Command"
        description="Antrean command ke device fisik -- diambil device saat polling getrequest berikutnya."
        action={<SendCommandDialog devices={devicesData.results} />}
      />
      <Card>
        <div className="flex items-center justify-between border-b border-border p-3">
          <SearchBar placeholder="Cari SN / isi command..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Command</TableHead>
              <TableHead><SortableHeader label="Diajukan" sortKey="CmdCommitTime" currentSort={ordering} basePath={BASE_PATH} searchParams={{ q: search }} /></TableHead>
              <TableHead>Diambil Device</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Oleh</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Belum ada command.</TableCell></TableRow>
            ) : (
              data.results.map((cmd) => (
                <TableRow key={cmd.id}>
                  <TableCell><CommandStatusBadge cmd={cmd} /></TableCell>
                  <TableCell className="font-mono">{cmd.SN}</TableCell>
                  <TableCell className="font-mono font-medium">{cmd.CmdContent}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{new Date(cmd.CmdCommitTime).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{cmd.CmdTransTime ? new Date(cmd.CmdTransTime).toLocaleString("id-ID") : "-"}</TableCell>
                  <TableCell className="font-tabular text-muted-foreground">{cmd.CmdOverTime ? new Date(cmd.CmdOverTime).toLocaleString("id-ID") : "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{cmd.Username ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteConfirmButton endpoint={`/iclock/device-command/${cmd.id}/`} label={`Command '${cmd.CmdContent}' untuk ${cmd.SN}`} />
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
