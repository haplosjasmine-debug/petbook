import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { createItem } from "@/lib/directus";
import type { Service } from "@/lib/types";
import { serviceSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = serviceSchema.parse(await request.json());
    const service = await createItem<Service>("services", {
      shop: session.shop.id,
      name: input.name,
      category: input.category,
      description: input.description || null,
      duration_min: input.duration_min,
      price: input.price,
      active: input.active ?? true,
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the service details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to create the service." }, { status: 500 });
  }
}
