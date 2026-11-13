import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { updateItem } from "@/lib/directus";
import type { Shop } from "@/lib/types";
import { shopSettingsSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = shopSettingsSchema.parse(await request.json());
    const shop = await updateItem<Shop>("shops", session.shop.id, {
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      city: input.city || null,
      address: input.address || null,
      description: input.description || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      logo: input.logo || null,
      ...(input.image ? { cover_image: input.image } : {}),
    });
    return NextResponse.json({ shop });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the shop details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to update the shop." }, { status: 500 });
  }
}
