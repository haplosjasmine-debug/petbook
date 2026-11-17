import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureCustomerProfile } from "@/lib/accounts";
import { DirectusError, fetchCurrentUser, refreshDirectus } from "@/lib/directus";
import { notifyLogin, resolveLoginAlertPhone } from "@/lib/notifications";
import { appRoleHome } from "@/lib/roles";
import { safeNext } from "@/lib/safe-next";
import { buildSession, setSessionCookies } from "@/lib/session";

const DIRECTUS_REFRESH_COOKIE = "directus_refresh_token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const jar = await cookies();
  const refreshToken = jar.get(DIRECTUS_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  try {
    const tokens = await refreshDirectus(refreshToken);
    const user = await fetchCurrentUser(tokens.access_token);
    await ensureCustomerProfile(user);

    const session = await buildSession(user, tokens.access_token);
    if (!session) {
      throw new DirectusError(
        "This account does not have a PetBook role. Contact the platform administrator.",
        403
      );
    }

    await setSessionCookies(tokens);
    jar.set(DIRECTUS_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
    try {
      await notifyLogin({
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
        role: session.role,
        phone: await resolveLoginAlertPhone(session),
        customerId: session.customer?.id ?? null,
        shopId: session.shop?.id ?? null,
        ip,
        userAgent: request.headers.get("user-agent"),
      });
    } catch (error) {
      console.error(
        "Login notification failed:",
        error instanceof Error ? error.message : error
      );
    }

    return NextResponse.redirect(new URL(next || appRoleHome(session.appRole), request.url));
  } catch (error) {
    console.error(
      "Google sign-in failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }
}
