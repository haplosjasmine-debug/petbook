import { DashboardShell } from "@/components/dashboard-shell";
import { requireCustomer } from "@/lib/session";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCustomer();
  return (
    <DashboardShell session={session} portal="customer">
      {children}
    </DashboardShell>
  );
}
