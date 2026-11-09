import Link from "next/link";
import { Bell, BellRing, CalendarDays, Mail, MessageSquare, Syringe } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  appointmentsByIds,
  customerAppointments,
  customerNotifications,
  customerReminders,
} from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate, titleCase } from "@/lib/utils";

export const metadata = { title: "Reminders" };

export default async function NotificationsPage() {
  const session = await requireCustomer();
  const appointments = await customerAppointments(session.customer!.id).catch(() => []);
  const [reminders, notifications] = await Promise.all([
    customerReminders(appointments).catch(() => []),
    customerNotifications(session.customer!.id).catch(() => []),
  ]);

  const appointmentMap = new Map(
    appointments.map((appointment) => [appointment.id, appointment])
  );
  const upcomingReminders = reminders
    .filter((reminder) => reminder.status === "scheduled")
    .slice(0, 8);

  if (!reminders.length && !notifications.length) {
    const appointmentIds = reminders.map((reminder) =>
      Number(typeof reminder.appointment === "object" ? reminder.appointment.id : reminder.appointment)
    );
    void appointmentsByIds(appointmentIds);
  }

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Reminders & messages"
        description="Appointment reminders, follow-ups, and updates from your shops."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/profile">Update contact details</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4 text-brand-600" /> Upcoming reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.length ? (
              upcomingReminders.map((reminder) => {
                const appointment = appointmentMap.get(
                  Number(
                    typeof reminder.appointment === "object"
                      ? reminder.appointment.id
                      : reminder.appointment
                  )
                );
                const Icon =
                  reminder.type === "vaccination"
                    ? Syringe
                    : reminder.type === "follow_up"
                      ? MessageSquare
                      : CalendarDays;

                return (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 rounded-xl border px-4 py-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {reminder.message ?? `${titleCase(reminder.type)} reminder`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(reminder.send_at)} · {reminder.channel}
                      </p>
                      {appointment ? (
                        <Link
                          href={`/dashboard/appointments/${appointment.id}`}
                          className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                        >
                          View appointment
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Bell}
                title="No reminders scheduled"
                description="Reminders appear automatically 24 hours before an appointment."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-brand-600" /> Message history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 rounded-xl border px-4 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    {notification.channel === "email" ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {notification.subject || titleCase(notification.channel)}
                      </p>
                      <StatusBadge status={notification.status} />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(notification.sent_at ?? notification.date_created)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Mail}
                title="No messages yet"
                description="Booking confirmations and updates will show up here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
