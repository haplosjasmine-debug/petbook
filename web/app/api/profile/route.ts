import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "@/lib/session";
import { adminRequest, DirectusError, updateItem } from "@/lib/directus";
import type { DirectusUser } from "@/lib/types";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  try {
    const input = profileSchema.parse(await request.json());
    const email = input.email.trim().toLowerCase();

    if (email !== session.user.email.toLowerCase()) {
      const existing = await adminRequest<{ data: DirectusUser[] }>(
        `/users?filter[email][_eq]=${encodeURIComponent(email)}&filter[id][_neq]=${encodeURIComponent(session.user.id)}&limit=1`
      );
      if (existing.data.length) {
        return NextResponse.json(
          { message: "That email is already used by another account." },
          { status: 409 }
        );
      }
    }

    await adminRequest(`/users/${session.user.id}`, {
      method: "PATCH",
      body: { first_name: input.first_name, last_name: input.last_name, email },
    });

    if (session.customer) {
      await updateItem("customers", session.customer.id, {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
        photo: input.photo || null,
      });
    }

    return NextResponse.json({ message: "Profile updated." });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check your details." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError && error.status === 400) {
      return NextResponse.json(
        { message: "That email or profile detail is not available." },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Unable to update your profile." }, { status: 500 });
  }
}
