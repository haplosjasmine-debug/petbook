import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { Session } from "@/lib/types";

export async function customerSession() {
  const session = await getSession();
  if (!session || session.role !== "Customer" || !session.customer) return null;
  return session as Session & { customer: NonNullable<Session["customer"]> };
}

export async function shopSession() {
  const session = await getSession();
  if (!session || session.role !== "Shop Owner" || !session.shop) return null;
  return session as Session & { shop: NonNullable<Session["shop"]> };
}

export async function adminSession() {
  const session = await getSession();
  if (!session || session.role !== "Administrator") return null;
  return session;
}

export function unauthorized(message = "Please sign in to continue.") {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource.") {
  return NextResponse.json({ message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function serverError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return NextResponse.json({ message }, { status: 500 });
}
