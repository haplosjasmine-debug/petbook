import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { createItem } from "@/lib/directus";
import type { ShopGalleryItem } from "@/lib/types";
import { gallerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = gallerySchema.parse(await request.json());
    const item = await createItem<ShopGalleryItem>("shop_gallery", {
      shop: session.shop.id,
      image_url: input.image_url,
      caption: input.caption || null,
      pet_name: input.pet_name || null,
      customer_name: input.customer_name || null,
      featured: input.featured ?? true,
      active: input.active ?? true,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the gallery details." },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { message: "Unable to add the gallery photo." },
      { status: 500 }
    );
  }
}
