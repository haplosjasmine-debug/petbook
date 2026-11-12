import { AdminBusinessApplications } from "@/components/admin/business-applications";
import { PageHeader } from "@/components/page-header";
import { listItems } from "@/lib/directus";
import type { BusinessApplication } from "@/lib/types";

export const metadata = { title: "Business applications" };
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const applications = await listItems<BusinessApplication>(
    "business_applications",
    "sort=-date_created&limit=100"
  ).catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Business applications"
        description="Review shop applications. Approving one creates the business owner account, shop, and manager staff record."
      />
      <AdminBusinessApplications applications={applications} />
    </>
  );
}
