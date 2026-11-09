import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  QrCode,
  Scissors,
  Stethoscope,
} from "lucide-react";
import { AppointmentActions } from "@/components/appointment-actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItem } from "@/lib/directus";
import { qrDataUrl } from "@/lib/qr";
import { customerAppointments, petVaccinations, transactionForAppointment } from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import type { Appointment, Pet, Service, Shop, Staff, Vaccination } from "@/lib/types";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export const metadata = { title: "Appointment" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCustomer();
  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isFinite(appointmentId)) notFound();

  const appointment = await getItem<{ data: Appointment }>("appointments", appointmentId, "?fields=*")
    .then((result) => result.data)
    .catch(() => null);

  if (!appointment || Number(appointment.customer) !== session.customer?.id) notFound();

  const [shop, service, pet, staff, transaction, image] = await Promise.all([
    getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*")
      .then((result) => result.data)
      .catch(() => null),
    getItem<{ data: Service }>("services", Number(appointment.service), "?fields=*")
      .then((result) => result.data)
      .catch(() => null),
    getItem<{ data: Pet }>("pets", Number(appointment.pet), "?fields=*")
      .then((result) => result.data)
      .catch(() => null),
    appointment.staff
      ? getItem<{ data: Staff }>("staff", Number(appointment.staff), "?fields=*")
          .then((result) => result.data)
          .catch(() => null)
      : Promise.resolve(null),
    transactionForAppointment(appointment.id).catch(() => null),
    qrDataUrl(appointment.qr_code).catch(() => null),
  ]);

  const vaccinations: Vaccination[] = appointment.pet
    ? await petVaccinations(Number(appointment.pet)).catch(() => [])
    : [];

  const upcoming = await customerAppointments(session.customer!.id, "").catch(() => []);
  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
  const isUpcoming =
    activeStatuses.includes(appointment.status) &&
    new Date(appointment.end_at).getTime() >= Date.now() - 60 * 60_000;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/dashboard/appointments">
          <ArrowLeft className="h-4 w-4" /> All appointments
        </Link>
      </Button>

      <PageHeader
        eyebrow={`Appointment #${appointment.id}`}
        title={service?.name ?? "Appointment details"}
        description={`${pet?.name ?? "Your pet"} at ${shop?.name ?? "partner shop"}`}
        action={<StatusBadge status={appointment.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {service?.category === "veterinary" ? (
                  <Stethoscope className="h-4 w-4 text-brand-600" />
                ) : (
                  <Scissors className="h-4 w-4 text-brand-600" />
                )}
                Visit details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Date & time
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  {formatDate(appointment.start_at)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Ends {formatDate(appointment.end_at)}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Pet
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                  <PawPrint className="h-4 w-4 text-brand-600" /> {pet?.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pet?.breed || titleCase(pet?.species)} · {pet?.sex}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Service
                </p>
                <p className="mt-1 text-sm font-semibold">{service?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {service?.duration_min} minutes · {titleCase(service?.category)}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Staff
                </p>
                <p className="mt-1 text-sm font-semibold">{staff?.name ?? "To be assigned"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {staff ? titleCase(staff.role) : "The shop will confirm shortly"}
                </p>
              </div>
              {appointment.notes ? (
                <div className="rounded-2xl bg-secondary/70 p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm">{appointment.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {appointment.status === "rejected" ? (
            <Card className="border-rose-200 bg-rose-50/70">
              <CardContent className="flex items-start gap-3 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black text-rose-900">The shop could not accept this booking</p>
                  <p className="mt-1 text-sm text-rose-800">
                    {appointment.rejection_reason ||
                      "Contact the shop for details, then choose another available time."}
                  </p>
                  <p className="mt-2 text-xs text-rose-700/80">
                    You can book another slot with this shop or browse other trusted partners.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-black">{formatMoney(appointment.price)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {transaction
                      ? `Payment status: ${transaction.status}`
                      : "Payment will be recorded when the visit is completed."}
                  </p>
                </div>
                {transaction ? <StatusBadge status={transaction.status} /> : null}
              </div>
              <div className="mt-4 border-t pt-4">
                <AppointmentActions
                  appointmentId={appointment.id}
                  status={appointment.status}
                  transactionStatus={transaction?.status ?? null}
                />
              </div>
            </CardContent>
          </Card>

          {vaccinations.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vaccination history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vaccinations.map((vaccination) => (
                  <div
                    key={vaccination.id}
                    className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{vaccination.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Given {formatDate(vaccination.administered_at, false)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {vaccination.next_due_at
                        ? `Next: ${formatDate(vaccination.next_due_at, false)}`
                        : "No due date"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4 text-brand-600" /> Check-in code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={`QR code for booking ${appointment.qr_code}`}
                  className="mx-auto h-48 w-48 rounded-xl border bg-white p-2"
                />
              ) : null}
              <p className="mt-3 break-all rounded-xl bg-secondary px-3 py-2 font-mono text-xs font-bold">
                {appointment.qr_code}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Show this at reception to check in.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shop contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-black">{shop?.name}</p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {shop?.address || "Address available on request"}
                {shop?.city ? `, ${shop.city}` : ""}
              </p>
              {shop?.phone ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-brand-600" />
                  <a href={`tel:${shop.phone}`} className="hover:underline">
                    {shop.phone}
                  </a>
                </p>
              ) : null}
              {shop?.email ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-brand-600" />
                  <a href={`mailto:${shop.email}`} className="hover:underline">
                    {shop.email}
                  </a>
                </p>
              ) : null}
            </CardContent>
          </Card>

          {isUpcoming ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Need to change this visit? You can cancel from the actions above and book a new
                time. Please contact the shop directly for same-day changes.
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
