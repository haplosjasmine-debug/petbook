import Link from "next/link";
import { CalendarDays, CalendarPlus, MapPin, PawPrint } from "lucide-react";
import { AppointmentActions } from "@/components/appointment-actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  customerAppointments,
  customerPets,
  customerTransactions,
  servicesByIds,
  shopsByIds,
} from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Appointments" };

const filters = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled / declined" },
  { key: "all", label: "All" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireCustomer();
  const customer = session.customer!;
  const params = await searchParams;
  const active = filters.some((filter) => filter.key === params.status)
    ? (params.status as string)
    : "upcoming";

  const [appointments, pets, transactions] = await Promise.all([
    customerAppointments(customer.id).catch(() => []),
    customerPets(customer.id).catch(() => []),
    customerTransactions(customer.id, 200).catch(() => []),
  ]);

  const [shops, services] = await Promise.all([
    shopsByIds([...new Set(appointments.map((appointment) => Number(appointment.shop)))]).catch(
      () => []
    ),
    servicesByIds(
      [...new Set(appointments.map((appointment) => Number(appointment.service)))]
    ).catch(() => []),
  ]);

  const shopMap = new Map(shops.map((shop) => [shop.id, shop]));
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const petMap = new Map(pets.map((pet) => [pet.id, pet]));
  const transactionMap = new Map(
    transactions.map((transaction) => [Number(transaction.appointment), transaction])
  );

  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
  const visible = appointments.filter((appointment) => {
    if (active === "all") return true;
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
        eyebrow="Appointments"
        title="Your visits"
        description="Track upcoming visits, payment status, and visit history."
        action={
          <Button asChild>
            <Link href="/dashboard/book">
              <CalendarPlus className="h-4 w-4" /> Book appointment
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={`/dashboard/appointments?status=${filter.key}`}
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
            const shop = shopMap.get(Number(appointment.shop));
            const service = serviceMap.get(Number(appointment.service));
            const pet = petMap.get(Number(appointment.pet));
            const transaction = transactionMap.get(appointment.id);

            return (
              <Card key={appointment.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                        <CalendarDays className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/appointments/${appointment.id}`}
                            className="text-base font-black hover:underline"
                          >
                            {service?.name ?? `Appointment #${appointment.id}`}
                          </Link>
                          <StatusBadge status={appointment.status} />
                          {transaction ? <StatusBadge status={transaction.status} /> : null}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <PawPrint className="h-3.5 w-3.5" /> {pet?.name ?? "Pet"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {shop?.name ?? "Shop"}
                          </span>
                          <span>{formatDate(appointment.start_at)}</span>
                        </p>
                        {appointment.notes ? (
                          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                            Note: {appointment.notes}
                          </p>
                        ) : null}
                        {appointment.status === "rejected" && appointment.rejection_reason ? (
                          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            Shop response: {appointment.rejection_reason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-3 lg:border-0 lg:pt-0">
                      <p className="text-lg font-black">{formatMoney(appointment.price)}</p>
                      <AppointmentActions
                        appointmentId={appointment.id}
                        status={appointment.status}
                        transactionStatus={transaction?.status ?? null}
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
          title="Nothing here yet"
          description="When you book a visit, it will appear in this list with reminders and payment status."
          action={
            <Button asChild>
              <Link href="/dashboard/book">Book your first appointment</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
