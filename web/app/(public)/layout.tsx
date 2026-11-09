import { PetParade } from "@/components/pet-parade";
import { SiteHeader, type HeaderSession } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let headerSession: HeaderSession = null;
  if (session) {
    const name =
      [session.user.first_name, session.user.last_name].filter(Boolean).join(" ") ||
      session.user.email;
    headerSession = {
      name,
      role: session.role,
      dashboardHref:
        session.role === "Shop Owner"
          ? "/shop"
          : session.role === "Administrator"
            ? "/admin"
            : "/dashboard",
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={headerSession} />
      <div className="flex-1">{children}</div>
      <PetParade />
      <SiteFooter />
    </div>
  );
}
