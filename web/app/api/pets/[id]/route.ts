import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { customerSession, unauthorized } from "@/lib/authz";
import { deleteItem, DirectusError, getItem, updateItem } from "@/lib/directus";
import type { Pet } from "@/lib/types";
import { petSchema } from "@/lib/validators";

async function ownedPet(id: number, customerId: number) {
  const result = await getItem<{ data: Pet }>("pets", id, "?fields=*");
  if (!result.data || Number(result.data.customer) !== customerId) return null;
  return result.data;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const pet = await ownedPet(Number((await context.params).id), session.customer.id);
    if (!pet) return NextResponse.json({ message: "Pet not found." }, { status: 404 });

    const input = petSchema.parse(await request.json());
    const updated = await updateItem<Pet>("pets", pet.id, {
      name: input.name,
      species: input.species,
      breed: input.breed || null,
      sex: input.sex,
      birth_date: input.birth_date || null,
      weight_kg: input.weight_kg ?? null,
      color: input.color || null,
      notes: input.notes || null,
      photo: input.photo || null,
    });

    return NextResponse.json({ pet: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the pet details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to update the pet." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const pet = await ownedPet(Number((await context.params).id), session.customer.id);
    if (!pet) return NextResponse.json({ message: "Pet not found." }, { status: 404 });

    await deleteItem("pets", pet.id);
    return NextResponse.json({ message: "Pet removed." });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json(
        {
          message:
            error.status === 400
              ? "This pet has appointments and cannot be removed yet."
              : error.message,
        },
        { status: error.status }
      );
    }
    return NextResponse.json({ message: "Unable to remove the pet." }, { status: 500 });
  }
}
