import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchCurrentUser, listItems } from "@/lib/directus";
import { appRoleHome, directusRoleName, normalizeRole, type AppRole } from "@/lib/roles";
import type { Customer, DirectusUser, Session, Shop, Staff } from "@/lib/types";

export const ACCESS_COOKIE = "pb_access";
export const REFRESH_COOKIE = "pb_refresh";
export const EXPIRES_COOKIE = "pb_expires";

export async function buildSession(
  user: DirectusUser,
  accessToken: string
): Promise<Session | null> {
  const appRole = normalizeRole(user.role);
  if (!appRole) return null;

  const role = directusRoleName(user.role);
  let customer: Customer | null = null;
  let shop: Shop | null = null;
  let staff: Staff | null = null;

  if (appRole === "pet_owner") {
    const rows = await listItems<Customer>(
      "customers",
      `filter[user][_eq]=${user.id}&limit=1`
    );
    customer = rows[0] ?? null;
  }

  if (appRole === "business_owner") {
    const rows = await listItems<Shop>("shops", `filter[owner][_eq]=${user.id}&limit=1`);
    shop = rows[0] ?? null;
  }

  if (appRole === "staff") {
    const rows = await listItems<Staff>(
      "staff",
      `filter[user][_eq]=${user.id}&limit=1&fields=*,shop.*`
    );
    staff = rows[0] ?? null;

    if (staff) {
      if (typeof staff.shop === "object") {
        shop = staff.shop;
      } else {
        const shops = await listItems<Shop>(
          "shops",
          `filter[id][_eq]=${staff.shop}&limit=1`
        );
        shop = shops[0] ?? null;
      }
    }
  }

  return { user, role, appRole, customer, shop, staff, accessToken };
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const user = await fetchCurrentUser(accessToken);
    return await buildSession(user, accessToken);
  } catch {
    return null;
  }
}

export async function requireSession(role?: AppRole) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.appRole !== role) redirect(appRoleHome(session.appRole));
  return session;
}

export async function requireCustomer() {
  return requireSession("pet_owner");
}

export async function requireShop() {
  return requireSession("business_owner");
}

export async function requireStaff() {
  const session = await requireSession("staff");
  if (!session.staff) redirect("/login?error=staff-profile");
  return session as Session & { staff: NonNullable<Session["staff"]> };
}

export async function requireAdmin() {
  return requireSession("super_admin");
}

export async function setSessionCookies(tokens: {
  access_token: string;
  refresh_token: string;
  expires: number;
}) {
  const jar = await cookies();
  const accessMaxAge = Math.max(Math.floor(tokens.expires / 1000), 60);

  jar.set(ACCESS_COOKIE, tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessMaxAge,
  });

  jar.set(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  jar.set(EXPIRES_COOKIE, String(Date.now() + tokens.expires), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessMaxAge,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  [ACCESS_COOKIE, REFRESH_COOKIE, EXPIRES_COOKIE].forEach((name) => {
    jar.set(name, "", { path: "/", maxAge: 0 });
  });
}
