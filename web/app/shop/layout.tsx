import { DashboardShell } from "@/components/dashboard-shell";
import { requireShop } from "@/lib/session";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await requireShop();
  return (
    <DashboardShell session={session} portal="shop">
      {children}
    </DashboardShell>
  );
}
