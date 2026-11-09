import { NextResponse } from "next/server";
import { customerSession, unauthorized } from "@/lib/authz";
import { DirectusError, getItem, listItems, updateItem } from "@/lib/directus";
import type { Appointment, Customer, Reminder, Shop } from "@/lib/types";
import { notifyCustomer } from "@/lib/notifications";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await customerSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const appointmentId = Number(id);

  try {
    const result = await getItem<{ data: Appointment }>("appointments", appointmentId, "?fields=*");
    const appointment = result.data;

    if (!appointment || Number(appointment.customer) !== session.customer.id) {
      return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
    }

    if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
      return NextResponse.json(
        { message: "This appointment can no longer be cancelled." },
        { status: 400 }
      );
    }

    await updateItem("appointments", appointment.id, { status: "cancelled" });

    const reminders = await listItems<Reminder>(
      "reminders",
      `filter[appointment][_eq]=${appointment.id}&filter[status][_eq]=scheduled`
    );
    await Promise.all(
      reminders.map((reminder) =>
        updateItem("reminders", reminder.id, { status: "cancelled" })
      )
    );

    const shop = await getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*").then(
      (response) => response.data
    );
    const customer = session.customer as Customer;

    await notifyCustomer({
      customer,
      shop,
      appointment,
      subject: "Appointment cancelled",
      body: `Your appointment at ${shop.name} has been cancelled. You can book a new time any time.`,
    }).catch(() => null);

    return NextResponse.json({ message: "Appointment cancelled." });
  } catch (error) {
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to cancel the appointment." }, { status: 500 });
  }
}
