import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { DirectusError, deleteItem, getItem, updateItem } from "@/lib/directus";
import type { Service } from "@/lib/types";
import { serviceSchema } from "@/lib/validators";

async function ownedService(id: number, shopId: number) {
  const result = await getItem<{ data: Service }>("services", id, "?fields=*");
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
    const service = await ownedService(Number((await context.params).id), session.shop.id);
    if (!service) return NextResponse.json({ message: "Service not found." }, { status: 404 });

    const input = serviceSchema.partial().parse(await request.json());
    const updated = await updateItem<Service>("services", service.id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.images !== undefined ? { images: input.images } : {}),
      ...(input.available_days !== undefined
        ? { available_days: input.available_days }
        : {}),
      ...(input.available_from !== undefined
        ? { available_from: input.available_from }
        : {}),
      ...(input.available_to !== undefined ? { available_to: input.available_to } : {}),
      ...(input.duration_min !== undefined ? { duration_min: input.duration_min } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    });
    return NextResponse.json({ service: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the service details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to update the service." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const service = await ownedService(Number((await context.params).id), session.shop.id);
    if (!service) return NextResponse.json({ message: "Service not found." }, { status: 404 });
    await deleteItem("services", service.id);
    return NextResponse.json({ message: "Service removed." });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json(
        {
          message:
            error.status === 400
              ? "This service is used by appointments. Deactivate it instead."
              : error.message,
        },
        { status: error.status }
      );
    }
    return NextResponse.json({ message: "Unable to remove the service." }, { status: 500 });
  }
}
