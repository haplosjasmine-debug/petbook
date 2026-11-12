import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createAccount } from "@/lib/accounts";
import { shopSession, unauthorized } from "@/lib/authz";
import { DirectusError, createItem } from "@/lib/directus";
import type { Staff } from "@/lib/types";
import { staffSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = staffSchema.parse(await request.json());
    const email = input.email || "";
    const password = input.password || "";

    if (password && !email) {
      return NextResponse.json(
        { message: "Add an email address before creating staff login access." },
        { status: 422 }
      );
    }

    const account = password
      ? await createAccount({
          email,
          password,
          name: input.name,
          role: "staff",
        })
      : null;

    const staff = await createItem<Staff>("staff", {
      shop: session.shop.id,
      user: account?.id ?? null,
      name: input.name,
      role: input.role,
      email: email || null,
      phone: input.phone || null,
      bio: input.bio || null,
      active: input.active ?? true,
    });
    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the staff details." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to add the staff member." }, { status: 500 });
  }
}
