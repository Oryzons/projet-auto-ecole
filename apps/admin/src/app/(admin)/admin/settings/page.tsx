import { Suspense } from "react";

import { SettingsView } from "@/components/admin/settings-view";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Organisation" title="Paramètres" description="Votre auto-école, vos tarifs et le paiement en ligne." />
      <Suspense>
        <SettingsView />
      </Suspense>
    </div>
  );
}
