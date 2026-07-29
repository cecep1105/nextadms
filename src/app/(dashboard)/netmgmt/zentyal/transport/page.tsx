import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { apiServerFetch } from "@/lib/api-server";
import type { MailTransportRow } from "@/types/api";
import { TransportMapEditor } from "./_components/transport-map-editor";

export default async function ZentyalTransportPage() {
  const data = await apiServerFetch<{ result: MailTransportRow[] }>("/netmgmt/zentyal-mail/transport/");

  return (
    <div>
      <PageHeader
        title="NetMgmt / Zentyal / Transport Map"
        description="Aturan routing domain -> relay tujuan Postfix. Simpan akan otomatis reload &amp; flush Postfix."
      />
      <Card>
        <TransportMapEditor initialRows={data.result} />
      </Card>
    </div>
  );
}
