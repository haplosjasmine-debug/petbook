import { NextResponse } from "next/server";
import { createNotification, dispatchNotification } from "@/lib/notifications";
import { getItem, listItems, updateItem } from "@/lib/directus";
import type { Appointment, Customer, Reminder, Shop } from "@/lib/types";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const due = await listItems<Reminder>(
    "reminders",
    `filter[status][_eq]=scheduled&filter[send_at][_lte]=${encodeURIComponent(now)}&sort=send_at&limit=100&fields=*`
  );

  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    try {
      const appointmentId =
        typeof reminder.appointment === "object" ? reminder.appointment.id : reminder.appointment;
      const appointmentResult = await getItem<{ data: Appointment }>(
        "appointments",
        appointmentId,
        "?fields=*"
      ).catch(() => null);

      const appointment = appointmentResult?.data;
      if (!appointment || ["cancelled", "no_show"].includes(appointment.status)) {
        await updateItem("reminders", reminder.id, { status: "cancelled" });
        continue;
      }

      const [customerResult, shopResult] = await Promise.all([
        getItem<{ data: Customer }>("customers", Number(appointment.customer), "?fields=*"),
        getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*"),
      ]);

      const customer = customerResult.data;
      const shop = shopResult.data;

      const notification = await createNotification({
        customer: customer.id,
        shop: shop.id,
        appointment: appointment.id,
        channel: reminder.channel === "email" ? "email" : "sms",
        recipient:
          reminder.channel === "email" ? customer.first_name : customer.phone ?? "",
        subject: reminder.type === "follow_up" ? "We miss you" : "Appointment reminder",
        body: reminder.message ?? `Reminder from ${shop.name}`,
      });

      const result = await dispatchNotification(notification);

      if (result.ok) {
        sent += 1;
        await updateItem("reminders", reminder.id, {
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } else {
        failed += 1;
        await updateItem("reminders", reminder.id, { status: "failed" });
      }
    } catch {
      failed += 1;
      await updateItem("reminders", reminder.id, { status: "failed" }).catch(() => null);
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed, ran_at: now });
}
