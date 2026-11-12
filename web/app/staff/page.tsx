import Link from "next/link";
import { CalendarCheck2, CalendarDays, Clock, Mail, Phone, Store } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StaffAppointmentsList } from "@/components/staff/appointments-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { staffAppointments } from "@/lib/queries";
import { requireStaff } from "@/lib/session";
import { titleCase } from "@/lib/utils";

export const metadata = { title: "Staff overview" };

export default async function StaffDashboardPage() {
  const session = await requireStaff();
  const staff = session.staff;
  const shop = session.shop;

  const appointments = await staffAppointments(staff.id).catch(() => []);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
  const today = appointments.filter((appointment) => {
    const start = new Date(appointment.start_at);
    return (
      start >= startOfDay &&
      start <= endOfDay &&
      !["cancelled", "rejected", "no_show"].includes(appointment.status)
    );
  });
  const upcoming = appointments.filter(
    (appointment) =>
      new Date(appointment.start_at) >= now && activeStatuses.includes(appointment.status)
  );

  return (
    <>
      <PageHeader
        eyebrow="Staff workspace"
        title={`Welcome, ${staff.name}`}
        description="Your assigned visits, shop details, and schedule in one place."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/staff/appointments">View full schedule</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Today's visits"
          value={today.length}
          hint="Assigned to you"
          icon={CalendarCheck2}
        />
        <StatCard
          label="Upcoming"
          value={upcoming.length}
          hint="Active assignments"
          icon={CalendarDays}
          tone="blue"
        />
        <StatCard
          label="Staff role"
          value={titleCase(staff.role)}
          hint={staff.active ? "Active and assignable" : "Currently inactive"}
          icon={Clock}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Next assignments</h2>
              <p className="text-sm text-muted-foreground">Your latest scheduled visits.</p>
            </div>
          </div>
          <StaffAppointmentsList
            staffId={staff.id}
            limit={5}
            emptyTitle="No upcoming assignments"
            emptyDescription="Your shop owner can assign visits to you from the business workspace."
          />
        </section>

        <Card className="h-fit">
          <CardContent className="p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Store className="h-6 w-6" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Your shop
            </p>
            <h2 className="mt-1 text-xl font-black">{shop?.name ?? "Shop not linked"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {shop?.city || "Ask your manager to complete the shop profile."}
            </p>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {staff.email ? (
                <p className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {staff.email}
                </p>
              ) : null}
              {staff.phone ? (
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {staff.phone}
                </p>
              ) : null}
            </div>

            {staff.bio ? (
              <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
                {staff.bio}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
