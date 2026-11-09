import Link from "next/link";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserMenu } from "@/components/user-menu";
import type { Session } from "@/lib/types";

export function DashboardShell({
  session,
  portal,
  children,
}: {
  session: Session;
  portal: "customer" | "shop" | "admin";
  children: React.ReactNode;
}) {
  const name =
    [session.user.first_name, session.user.last_name].filter(Boolean).join(" ") ||
    session.user.email;
  const home = portal === "shop" ? "/shop" : portal === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href={home} />
            <span className="hidden rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:inline">
              {portal === "shop" ? "Business" : portal === "admin" ? "Admin" : "Pet owner"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary sm:inline"
            >
              Public site
            </Link>
            <UserMenu name={name} role={session.role} dashboardHref={home} />
          </div>
        </div>
      </header>

      <div className="page-shell grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:rounded-2xl lg:border lg:bg-white/70 lg:p-3">
          <DashboardNav portal={portal} />
        </aside>
        <main className="min-w-0 pb-16">{children}</main>
      </div>
    </div>
  );
}
