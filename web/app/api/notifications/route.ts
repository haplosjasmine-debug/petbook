import { NextResponse } from "next/server";
import { listItems } from "@/lib/directus";
import { customerAppointments, customerReminders } from "@/lib/queries";
import { getSession } from "@/lib/session";
import type { AppNotification, Reminder } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  }

  try {
    if (session.appRole === "pet_owner" && session.customer) {
      const [notifications, appointments] = await Promise.all([
        listItems<AppNotification>(
          "notifications",
          `filter[customer][_eq]=${session.customer.id}&filter[channel][_eq]=system&sort=-date_created&limit=20`
        ),
        customerAppointments(session.customer.id).catch(() => []),
      ]);
      const reminders = await customerReminders(appointments).catch(() => []);

      return NextResponse.json({
        notifications,
        reminders: reminders
          .filter((reminder: Reminder) => reminder.status === "scheduled")
          .slice(0, 8),
      });
    }

    if (
      (session.appRole === "business_owner" || session.appRole === "staff") &&
      session.shop
    ) {
      const notifications = await listItems<AppNotification>(
        "notifications",
        `filter[shop][_eq]=${session.shop.id}&filter[channel][_eq]=system&sort=-date_created&limit=20`
      );
      return NextResponse.json({ notifications, reminders: [] });
    }

    return NextResponse.json({ notifications: [], reminders: [] });
  } catch {
    return NextResponse.json({ message: "Unable to load notifications." }, { status: 500 });
  }
}
