import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { customerSession, unauthorized } from "@/lib/authz";
import { createItem, listItems } from "@/lib/directus";
import type { Pet } from "@/lib/types";
import { petSchema } from "@/lib/validators";

export async function GET() {
  const session = await customerSession();
  if (!session) return unauthorized();

  const pets = await listItems<Pet>(
    "pets",
    `filter[customer][_eq]=${session.customer.id}&sort=name`
  );
  return NextResponse.json({ pets });
}

export async function POST(request: Request) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const input = petSchema.parse(await request.json());
    const pet = await createItem<Pet>("pets", {
      customer: session.customer.id,
      name: input.name,
      species: input.species,
      breed: input.breed || null,
      sex: input.sex,
      birth_date: input.birth_date || null,
      weight_kg: input.weight_kg ?? null,
      color: input.color || null,
      notes: input.notes || null,
      photo: null,
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the pet details." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to add the pet." }, { status: 500 });
  }
}
