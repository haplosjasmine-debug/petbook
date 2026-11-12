import { PageHeader } from "@/components/page-header";
import { StaffAppointmentsList } from "@/components/staff/appointments-list";
import { requireStaff } from "@/lib/session";

export const metadata = { title: "My schedule" };

export default async function StaffAppointmentsPage() {
  const session = await requireStaff();

  return (
    <>
      <PageHeader
        eyebrow="Staff workspace"
        title="My schedule"
        description="Every appointment assigned to you by the shop owner."
      />
      <StaffAppointmentsList
        staffId={session.staff.id}
        emptyTitle="No appointments yet"
        emptyDescription="When the shop owner assigns visits to you, they will show up here."
      />
    </>
  );
}
