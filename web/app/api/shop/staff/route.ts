import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { createItem } from "@/lib/directus";
import type { Staff } from "@/lib/types";
import { staffSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = staffSchema.parse(await request.json());
    const staff = await createItem<Staff>("staff", {
      shop: session.shop.id,
      user: null,
      name: input.name,
      role: input.role,
      email: input.email || null,
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
    return NextResponse.json({ message: "Unable to add the staff member." }, { status: 500 });
  }
}
