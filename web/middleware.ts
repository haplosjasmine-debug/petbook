import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "pb_access";
const REFRESH_COOKIE = "pb_refresh";
const EXPIRES_COOKIE = "pb_expires";

const protectedPrefixes = ["/dashboard", "/shop", "/staff", "/admin"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const expiresAt = Number(request.cookies.get(EXPIRES_COOKIE)?.value ?? 0);
  const needsRefresh = !accessToken || expiresAt < Date.now() + 30_000;

  if (needsRefresh && refreshToken && process.env.DIRECTUS_URL) {
    try {
      const response = await fetch(`${process.env.DIRECTUS_URL.replace(/\/$/, "")}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          data: { access_token: string; refresh_token: string; expires: number };
        };
        const tokens = payload.data;
        const next = NextResponse.next();
        const secure = process.env.NODE_ENV === "production";
        const accessMaxAge = Math.max(Math.floor(tokens.expires / 1000), 60);

        next.cookies.set(ACCESS_COOKIE, tokens.access_token, {
          httpOnly: true,
          sameSite: "lax",
          secure,
          path: "/",
          maxAge: accessMaxAge,
        });
        next.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
          httpOnly: true,
          sameSite: "lax",
          secure,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        next.cookies.set(EXPIRES_COOKIE, String(Date.now() + tokens.expires), {
          httpOnly: true,
          sameSite: "lax",
          secure,
          path: "/",
          maxAge: accessMaxAge,
        });
        return next;
      }
    } catch {
      // Fall through to the login redirect.
    }
  }

  if (isProtected && (!accessToken || needsRefresh)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/shop/:path*", "/staff/:path*", "/admin/:path*"],
};
