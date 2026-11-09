import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshDirectus } from "@/lib/directus";
import { ACCESS_COOKIE, REFRESH_COOKIE, setSessionCookies } from "@/lib/session";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const jar = await cookies();
  let accessToken = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${(process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055").replace(/\/$/, "")}/${path.join("/")}${url.search}`;

  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();

  const send = async (token: string | undefined) =>
    fetch(target, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
    });

  let response = await send(accessToken);

  if (response.status === 401 && refreshToken) {
    try {
      const tokens = await refreshDirectus(refreshToken);
      await setSessionCookies(tokens);
      accessToken = tokens.access_token;
      response = await send(accessToken);
    } catch {
      return NextResponse.json({ message: "Session expired." }, { status: 401 });
    }
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
