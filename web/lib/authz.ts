import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { Session } from "@/lib/types";

export async function customerSession() {
  const session = await getSession();
  if (!session || session.appRole !== "pet_owner" || !session.customer) return null;
  return session as Session & { customer: NonNullable<Session["customer"]> };
}

export async function shopSession() {
  const session = await getSession();
  if (!session || session.appRole !== "business_owner" || !session.shop) return null;
  return session as Session & { shop: NonNullable<Session["shop"]> };
}

export async function staffSession() {
  const session = await getSession();
  if (!session || session.appRole !== "staff" || !session.staff) return null;
  return session as Session & { staff: NonNullable<Session["staff"]> };
}

export async function adminSession() {
  const session = await getSession();
  if (!session || session.appRole !== "super_admin") return null;
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
