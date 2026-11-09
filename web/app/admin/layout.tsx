import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <DashboardShell session={session} portal="admin">
      {children}
    </DashboardShell>
  );
}
