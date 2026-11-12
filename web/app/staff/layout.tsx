import { DashboardShell } from "@/components/dashboard-shell";
import { requireStaff } from "@/lib/session";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  return (
    <DashboardShell session={session} portal="staff">
      {children}
    </DashboardShell>
  );
}
