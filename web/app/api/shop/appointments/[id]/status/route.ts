import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { DirectusError, getItem, listItems, updateItem } from "@/lib/directus";
import { notifyCustomer } from "@/lib/notifications";
import { completeAppointment } from "@/lib/payments";
import type { Appointment, Customer, Reminder, Shop } from "@/lib/types";
import { statusSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const input = statusSchema.parse(await request.json());
    const appointmentId = Number((await context.params).id);
    const result = await getItem<{ data: Appointment }>("appointments", appointmentId, "?fields=*");
    const appointment = result.data;

    if (!appointment || Number(appointment.shop) !== session.shop.id) {
      return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
    }

    if (input.status === "completed") {
      const completed = await completeAppointment(appointment.id);
      return NextResponse.json({
        message: "Appointment completed and commission recorded.",
        appointment: completed.appointment,
      });
    }

    const patch: Record<string, unknown> = { status: input.status };
    if (input.notes) patch.notes = input.notes;
    if (input.status === "checked_in") patch.checked_in_at = new Date().toISOString();
    if (input.status === "cancelled") patch.completed_at = null;

    const updated = await updateItem<Appointment>("appointments", appointment.id, patch);

    if (input.status === "cancelled") {
      const reminders = await listItems<Reminder>(
        "reminders",
        `filter[appointment][_eq]=${appointment.id}&filter[status][_eq]=scheduled`
      );
      await Promise.all(
        reminders.map((reminder) =>
          updateItem("reminders", reminder.id, { status: "cancelled" })
        )
      );
    }

    if (["confirmed", "cancelled", "no_show"].includes(input.status)) {
      const [customerResult, shopResult] = await Promise.all([
        getItem<{ data: Customer }>("customers", Number(appointment.customer), "?fields=*"),
        getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*"),
      ]);

      await notifyCustomer({
        customer: customerResult.data,
        shop: shopResult.data,
        appointment,
        subject:
          input.status === "cancelled"
            ? "Appointment cancelled by the shop"
            : `Appointment ${input.status.replace("_", " ")}`,
        body:
          input.status === "cancelled"
            ? `Your appointment at ${shopResult.data.name} was cancelled. Please rebook when ready.`
            : `Your appointment at ${shopResult.data.name} is now ${input.status.replace("_", " ")}.`,
      }).catch(() => null);
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the status." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to update the appointment." }, { status: 500 });
  }
}
