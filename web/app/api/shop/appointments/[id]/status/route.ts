import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { shopSession, unauthorized } from "@/lib/authz";
import { DirectusError, getItem, listItems, updateItem } from "@/lib/directus";
import { notifyCustomer, scheduleAppointmentReminder } from "@/lib/notifications";
import { completeAppointment } from "@/lib/payments";
import type { Appointment, Customer, Pet, Reminder, Service, Shop } from "@/lib/types";
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

    const reason = input.reason?.trim() ?? "";
    const cleanReason = reason.replace(/[.!?]+$/, "");
    if (input.status === "rejected" && reason.length < 5) {
      return NextResponse.json(
        { message: "Add a short reason so the customer knows why the booking was declined." },
        { status: 422 }
      );
    }

    if (input.status === "completed") {
      const completed = await completeAppointment(appointment.id);
      return NextResponse.json({
        message: "Appointment completed.",
        appointment: completed.appointment,
      });
    }

    const patch: Record<string, unknown> = { status: input.status };
    if (input.notes) patch.notes = input.notes;
    if (input.status === "checked_in") patch.checked_in_at = new Date().toISOString();
    if (["cancelled", "rejected"].includes(input.status)) patch.completed_at = null;
    if (input.status === "rejected") patch.rejection_reason = reason;
    if (input.status === "confirmed") patch.rejection_reason = null;

    const updated = await updateItem<Appointment>("appointments", appointment.id, patch);

    if (["cancelled", "rejected"].includes(input.status)) {
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

    if (["confirmed", "cancelled", "rejected", "no_show"].includes(input.status)) {
      const [customerResult, shopResult] = await Promise.all([
        getItem<{ data: Customer }>("customers", Number(appointment.customer), "?fields=*"),
        getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*"),
      ]);

      const subject =
        input.status === "confirmed"
          ? "Appointment confirmed"
          : input.status === "rejected"
            ? "Booking request declined"
            : input.status === "cancelled"
              ? "Appointment cancelled by the shop"
              : "Appointment marked as no-show";
      const body =
        input.status === "confirmed"
          ? `Good news! ${shopResult.data.name} confirmed your appointment. Your reminder is scheduled for 24 hours before the visit.`
          : input.status === "rejected"
            ? `${shopResult.data.name} could not accept this booking. Reason: ${cleanReason}. You can choose another time or contact the shop for help.`
            : input.status === "cancelled"
              ? `Your appointment at ${shopResult.data.name} was cancelled.${cleanReason ? ` Reason: ${cleanReason}.` : ""} Please rebook when ready.`
              : `Your appointment at ${shopResult.data.name} was marked as a no-show. Contact the shop if you think this is a mistake.`;

      await notifyCustomer({
        customer: customerResult.data,
        shop: shopResult.data,
        appointment,
        subject,
        body,
      }).catch(() => null);

      if (input.status === "confirmed") {
        const [serviceResult, petResult] = await Promise.all([
          getItem<{ data: Service }>("services", Number(appointment.service), "?fields=*"),
          getItem<{ data: Pet }>("pets", Number(appointment.pet), "?fields=*"),
        ]);
        await scheduleAppointmentReminder({
          appointment,
          customer: customerResult.data,
          shop: shopResult.data,
          serviceName: serviceResult.data.name,
          petName: petResult.data.name,
        }).catch(() => null);
      }
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
