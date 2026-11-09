import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshDirectus } from "@/lib/directus";
import { REFRESH_COOKIE, setSessionCookies } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token." }, { status: 401 });
  }

  try {
    const tokens = await refreshDirectus(refreshToken);
    await setSessionCookies(tokens);
    return NextResponse.json({ message: "Session refreshed." });
  } catch {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }
}
