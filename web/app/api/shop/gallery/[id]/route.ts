import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { deleteItem, getItem, updateItem } from "@/lib/directus";
import type { ShopGalleryItem } from "@/lib/types";
import { gallerySchema } from "@/lib/validators";

async function ownedItem(id: number, shopId: number) {
  const result = await getItem<{ data: ShopGalleryItem }>("shop_gallery", id, "?fields=*");
  if (!result.data || Number(result.data.shop) !== shopId) return null;
  return result.data;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const item = await ownedItem(Number((await context.params).id), session.shop.id);
    if (!item) return NextResponse.json({ message: "Gallery photo not found." }, { status: 404 });

    const input = gallerySchema.partial().parse(await request.json());
    const updated = await updateItem<ShopGalleryItem>("shop_gallery", item.id, {
      ...(input.image_url !== undefined ? { image_url: input.image_url } : {}),
      ...(input.caption !== undefined ? { caption: input.caption || null } : {}),
      ...(input.pet_name !== undefined ? { pet_name: input.pet_name || null } : {}),
      ...(input.customer_name !== undefined
        ? { customer_name: input.customer_name || null }
        : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    });
    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the gallery details." },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { message: "Unable to update the gallery photo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const item = await ownedItem(Number((await context.params).id), session.shop.id);
    if (!item) return NextResponse.json({ message: "Gallery photo not found." }, { status: 404 });
    await deleteItem("shop_gallery", item.id);
    return NextResponse.json({ message: "Gallery photo removed." });
  } catch {
    return NextResponse.json(
      { message: "Unable to remove the gallery photo." },
      { status: 500 }
    );
  }
}
