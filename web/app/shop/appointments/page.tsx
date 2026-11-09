import Link from "next/link";
import { CalendarDays, Clock, MapPin, PawPrint, UserRound } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CheckInForm } from "@/components/shop/check-in-form";
import { ShopAppointmentActions } from "@/components/shop/appointment-actions";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  customersByIds,
  petsByIds,
  servicesByIds,
  shopAppointments,
  shopStaff,
} from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export const metadata = { title: "Appointments" };

const filters = [
  { key: "pending", label: "Needs response" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled / declined" },
  { key: "all", label: "All" },
];

export default async function ShopAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireShop();
  const shop = session.shop!;
  const params = await searchParams;
  const active = filters.some((filter) => filter.key === params.status)
    ? (params.status as string)
    : "upcoming";

  const [appointments, staff] = await Promise.all([
    shopAppointments(shop.id).catch(() => []),
    shopStaff(shop.id).catch(() => []),
  ]);

  const [services, customers, pets] = await Promise.all([
    servicesByIds([...new Set(appointments.map((appointment) => Number(appointment.service)))]).catch(
      () => []
    ),
    customersByIds(
      [...new Set(appointments.map((appointment) => Number(appointment.customer)))]
    ).catch(() => []),
    petsByIds([...new Set(appointments.map((appointment) => Number(appointment.pet)))]).catch(
      () => []
    ),
  ]);

  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
  const petMap = new Map(pets.map((pet) => [pet.id, pet]));
  const staffMap = new Map(staff.map((member) => [member.id, member]));

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];

  const visible = appointments.filter((appointment) => {
    const start = new Date(appointment.start_at);
    if (active === "pending") return appointment.status === "pending";
    if (active === "today") {
      return (
        start >= startOfDay &&
        start <= endOfDay &&
        !["cancelled", "rejected", "no_show"].includes(appointment.status)
      );
    }
    if (active === "upcoming") {
      return (
        activeStatuses.includes(appointment.status) &&
        new Date(appointment.end_at).getTime() >= Date.now() - 60 * 60_000
      );
    }
    if (active === "completed") return appointment.status === "completed";
    if (active === "cancelled") {
      return ["cancelled", "rejected", "no_show"].includes(appointment.status);
    }
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Confirm bookings, check pets in, and complete visits."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Quick check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckInForm />
        </CardContent>
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={`/shop/appointments?status=${filter.key}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active === filter.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "bg-white hover:bg-secondary"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {visible.length ? (
        <div className="space-y-3">
          {visible.map((appointment) => {
            const customer = customerMap.get(Number(appointment.customer));
            const pet = petMap.get(Number(appointment.pet));
            const service = serviceMap.get(Number(appointment.service));
            const member = appointment.staff
              ? staffMap.get(Number(appointment.staff))
              : null;

            return (
              <Card key={appointment.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                        <CalendarDays className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black">
                            {service?.name ?? `Appointment #${appointment.id}`}
                          </p>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <PawPrint className="h-3.5 w-3.5" /> {pet?.name ?? "Pet"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            {customer
                              ? `${customer.first_name} ${customer.last_name}`
                              : "Customer"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {formatDate(appointment.start_at)}
                          </span>
                          {member ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {member.name} ·{" "}
                              {titleCase(member.role)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {appointment.qr_code}
                        </p>
                        {appointment.notes ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Note: {appointment.notes}
                          </p>
                        ) : null}
                        {appointment.status === "rejected" && appointment.rejection_reason ? (
                          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            Declined: {appointment.rejection_reason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-3 xl:border-0 xl:pt-0">
                      <p className="text-lg font-black">{formatMoney(appointment.price)}</p>
                      <ShopAppointmentActions
                        appointmentId={appointment.id}
                        status={appointment.status}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No appointments in this view"
          description="Try another filter, or wait for your next customer booking."
          action={
            <Button asChild variant="outline">
              <Link href="/shop/appointments?status=all">Show all</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
