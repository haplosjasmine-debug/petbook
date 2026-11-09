import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchCurrentUser, listItems } from "@/lib/directus";
import type { DirectusRole, Customer, Session, Shop } from "@/lib/types";

export const ACCESS_COOKIE = "pb_access";
export const REFRESH_COOKIE = "pb_refresh";
export const EXPIRES_COOKIE = "pb_expires";

export function roleName(role: DirectusRole | string | null | undefined) {
  if (!role) return "";
  return typeof role === "object" ? role.name : "";
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const user = await fetchCurrentUser(accessToken);
    const role = roleName(user.role);

    let customer: Customer | null = null;
    let shop: Shop | null = null;

    if (role === "Customer") {
      const rows = await listItems<Customer>(
        "customers",
        `filter[user][_eq]=${user.id}&limit=1`
      );
      customer = rows[0] ?? null;
    }

    if (role === "Shop Owner") {
      const rows = await listItems<Shop>("shops", `filter[owner][_eq]=${user.id}&limit=1`);
      shop = rows[0] ?? null;
    }

    return { user, role, customer, shop, accessToken };
  } catch {
    return null;
  }
}

export async function requireSession(role?: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) {
    if (session.role === "Shop Owner") redirect("/shop");
    if (session.role === "Administrator") redirect("/admin");
    redirect("/dashboard");
  }
  return session;
}

export async function requireCustomer() {
  return requireSession("Customer");
}

export async function requireShop() {
  return requireSession("Shop Owner");
}

export async function requireAdmin() {
  return requireSession("Administrator");
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
