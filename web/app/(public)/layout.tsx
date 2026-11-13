import { redirect } from "next/navigation";
import { SiteHeader, type HeaderSession } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { directusFileUrl } from "@/lib/directus";
import { appRoleHome, appRoleLabel } from "@/lib/roles";
import { getSession } from "@/lib/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.appRole === "business_owner" || session?.appRole === "super_admin") {
    redirect(appRoleHome(session.appRole));
  }

  let headerSession: HeaderSession = null;
  if (session) {
    const name =
      [session.user.first_name, session.user.last_name].filter(Boolean).join(" ") ||
      session.user.email;
    headerSession = {
      name,
      role: appRoleLabel(session.appRole),
      appRole: session.appRole,
      dashboardHref: appRoleHome(session.appRole),
      avatarUrl: directusFileUrl(session.customer?.photo),
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={headerSession} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
