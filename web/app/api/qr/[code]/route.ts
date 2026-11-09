import { NextResponse } from "next/server";
import { listItems } from "@/lib/directus";
import { qrDataUrl } from "@/lib/qr";
import type { Appointment } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const rows = await listItems<Appointment>(
    "appointments",
    `filter[qr_code][_eq]=${encodeURIComponent(code)}&limit=1&fields=id,status,start_at,price`
  );

  const appointment = rows[0];
  if (!appointment) {
    return NextResponse.json({ message: "Booking code not found." }, { status: 404 });
  }

  const image = await qrDataUrl(code);

  return NextResponse.json({
    image,
    appointment: {
      id: appointment.id,
      status: appointment.status,
      start_at: appointment.start_at,
      price: appointment.price,
    },
  });
}
