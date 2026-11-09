import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { listItems, updateItem } from "@/lib/directus";
import type { Appointment } from "@/lib/types";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = checkInSchema.parse(await request.json());
    const rows = await listItems<Appointment>(
      "appointments",
      `filter[qr_code][_eq]=${encodeURIComponent(input.code)}&filter[shop][_eq]=${session.shop.id}&limit=1&fields=*`
    );

    const appointment = rows[0];
    if (!appointment) {
      return NextResponse.json({ message: "No matching booking at this shop." }, { status: 404 });
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return NextResponse.json(
        { message: `This booking is already ${appointment.status.replace("_", " ")}.` },
        { status: 400 }
      );
    }

    const updated = await updateItem<Appointment>("appointments", appointment.id, {
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Checked in.", appointment: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Enter a valid booking code." },
        { status: 422 }
      );
    }
    return NextResponse.json({ message: "Unable to check in." }, { status: 500 });
  }
}
