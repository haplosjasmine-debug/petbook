import { CalendarDays, Clock, PawPrint } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  customersByIds,
  petsByIds,
  servicesByIds,
  staffAppointments,
} from "@/lib/queries";
import type { Appointment } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export async function StaffAppointmentsList({
  staffId,
  limit,
  emptyTitle = "No appointments assigned",
  emptyDescription = "The shop owner will assign appointments to you from the business workspace.",
}: {
  staffId: number;
  limit?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const appointments = await staffAppointments(staffId).catch(() => []);
  const visible = limit ? appointments.slice(0, limit) : appointments;

  const serviceIds = [...new Set(visible.map((item) => Number(item.service)))];
  const customerIds = [...new Set(visible.map((item) => Number(item.customer)))];
  const petIds = [...new Set(visible.map((item) => Number(item.pet)))];

  const [services, customers, pets] = await Promise.all([
    servicesByIds(serviceIds).catch(() => []),
    customersByIds(customerIds).catch(() => []),
    petsByIds(petIds).catch(() => []),
  ]);

  const serviceMap = new Map(services.map((service) => [service.id, service.name]));
  const customerMap = new Map(
    customers.map((customer) => [customer.id, `${customer.first_name} ${customer.last_name}`])
  );
  const petMap = new Map(pets.map((pet) => [pet.id, pet.name]));

  if (!visible.length) {
    return <EmptyState icon={CalendarDays} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {visible.map((appointment: Appointment) => (
        <Card key={appointment.id}>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <PawPrint className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">
                    {petMap.get(Number(appointment.pet)) ?? "Pet"} ·{" "}
                    {serviceMap.get(Number(appointment.service)) ?? "Service"}
                  </p>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {customerMap.get(Number(appointment.customer)) ?? "Customer"}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(appointment.start_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(appointment.end_at)}
                  </span>
                </div>
                {appointment.notes ? (
                  <p className="mt-2 text-xs text-muted-foreground">{appointment.notes}</p>
                ) : null}
              </div>
            </div>
            <p className="text-sm font-black sm:text-right">
              {formatMoney(appointment.price)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
