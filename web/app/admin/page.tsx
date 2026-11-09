import { ExternalLink, ShieldCheck } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { emptyAdminMetrics, getAdminMetrics } from "@/lib/admin-metrics";
import { directusAdminUrl } from "@/lib/config";

export const metadata = { title: "Revenue dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const metrics = await getAdminMetrics().catch(() => emptyAdminMetrics());

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Revenue command center"
        description="Track gross bookings, PetBook commission, shop payouts, and live revenue movement."
        action={
          <Button asChild variant="outline" size="sm">
            <a href={directusAdminUrl()} target="_blank" rel="noreferrer">
              <ShieldCheck className="h-4 w-4" /> Directus admin
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        }
      />
      <AdminDashboard initial={metrics} />
    </>
  );
}
