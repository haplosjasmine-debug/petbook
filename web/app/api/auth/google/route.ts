import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { safeNext } from "@/lib/safe-next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  if (process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED !== "true") {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", request.url));
  }

  const callback = new URL("/api/auth/google/callback", appConfig.appUrl);
  if (next) callback.searchParams.set("next", next);

  const target = new URL("/auth/login/google", appConfig.directusPublicUrl);
  target.searchParams.set("redirect", callback.toString());

  return NextResponse.redirect(target);
}
