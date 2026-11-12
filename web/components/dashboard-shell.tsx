import Link from "next/link";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { NotificationCenter } from "@/components/notification-center";
import { UserMenu } from "@/components/user-menu";
import { appRoleLabel } from "@/lib/roles";
import type { Session } from "@/lib/types";

export function DashboardShell({
  session,
  portal,
  children,
}: {
  session: Session;
  portal: "customer" | "shop" | "staff" | "admin";
  children: React.ReactNode;
}) {
  const name =
    [session.user.first_name, session.user.last_name].filter(Boolean).join(" ") ||
    session.user.email;
  const home =
    portal === "shop"
      ? "/shop"
      : portal === "staff"
        ? "/staff"
        : portal === "admin"
          ? "/admin"
          : "/dashboard";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo href={home} />
            <span className="hidden rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:inline">
              {portal === "shop"
                ? "Business"
                : portal === "staff"
                  ? "Staff"
                  : portal === "admin"
                    ? "Admin"
                    : "Pet owner"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary sm:inline"
            >
              Public site
            </Link>
            {portal !== "admin" ? <NotificationCenter portal={portal} /> : null}
            <UserMenu name={name} role={appRoleLabel(session.appRole)} dashboardHref={home} />
          </div>
        </div>
      </header>

      <div className="page-shell grid gap-6 py-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:border-r lg:py-6 lg:pr-5">
          <DashboardNav portal={portal} />
          <div className="mt-auto hidden rounded-2xl border bg-secondary/50 p-4 lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {portal === "shop"
                ? "Business workspace"
                : portal === "staff"
                  ? "Staff workspace"
                  : "PetBook"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {portal === "shop"
                ? "Keep your services, team, and appointment queue up to date."
                : portal === "staff"
                  ? "See your assigned appointments and the shop you work with."
                  : "Your visits, pet records, and booking updates live here."}
            </p>
          </div>
        </aside>
        <main className="min-w-0 pb-16">{children}</main>
      </div>
    </div>
  );
}
