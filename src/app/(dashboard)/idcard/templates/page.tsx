import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiServerFetch } from "@/lib/api-server";
import type { IDCardTemplate } from "@/types/api";
import { AddTemplateButton } from "./_components/add-template-button";
import { TemplateActionsMenu } from "./_components/template-actions-menu";

export const dynamic = "force-dynamic";

const CARD_TYPE_LABEL: Record<string, string> = {
  karyawan: "Karyawan", driver: "Driver", visitor: "Visitor", bhl: "BHL",
};

export default async function IdCardTemplatesPage() {
  const templates = await apiServerFetch<IDCardTemplate[]>("/idcard/templates/");

  return (
    <div>
      <PageHeader
        title="Template ID Card"
        description="Gambar background per jenis kartu -- posisi foto & teks di atasnya sudah ditentukan (fixed), tidak perlu diatur di sini."
        action={<AddTemplateButton />}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Jenis Kartu</TableHead>
              <TableHead>Nama Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada template. Tambahkan template pertama Anda.</TableCell></TableRow>
            ) : (
              templates.map((tmpl) => (
                <TableRow key={tmpl.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tmpl.background_image} alt={tmpl.name} className="h-20 w-14 rounded border border-border object-cover" />
                  </TableCell>
                  <TableCell><Badge variant="secondary">{CARD_TYPE_LABEL[tmpl.card_type] ?? tmpl.card_type}</Badge></TableCell>
                  <TableCell className="font-medium">{tmpl.name}</TableCell>
                  <TableCell>
                    {tmpl.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <TemplateActionsMenu template={tmpl} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
