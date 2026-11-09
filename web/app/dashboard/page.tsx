import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  CreditCard,
  HeartPulse,
  PawPrint,
  ReceiptText,
  Sparkles,
  Store,
  Syringe,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  customerAppointments,
  customerLoyalty,
  customerPets,
  customerReminders,
  customerTransactions,
  petVaccinations,
  servicesByIds,
  shopsByIds,
} from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function CustomerDashboardPage() {
  const session = await requireCustomer();
  const customer = session.customer!;

  const [appointments, pets, loyalty, transactions] = await Promise.all([
    customerAppointments(customer.id).catch(() => []),
    customerPets(customer.id).catch(() => []),
    customerLoyalty(customer.id).catch(() => []),
    customerTransactions(customer.id, 5).catch(() => []),
  ]);

  const reminders = await customerReminders(appointments).catch(() => []);
  const vaccinations = (
    await Promise.all(pets.map((pet) => petVaccinations(pet.id).catch(() => [])))
  ).flat();

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

  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
  const upcoming = appointments
    .filter(
      (appointment) =>
        activeStatuses.includes(appointment.status) &&
        new Date(appointment.end_at).getTime() >= Date.now() - 60 * 60_000
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const nextReminder = reminders.find((reminder) => reminder.status === "scheduled");
  const completed = appointments.filter((appointment) => appointment.status === "completed");
  const now = Date.now();
  const dueVaccinations = vaccinations
    .filter((vaccination) => vaccination.next_due_at)
    .filter(
      (vaccination) =>
        new Date(vaccination.next_due_at as string).getTime() <= now + 30 * 24 * 60 * 60_000
    )
    .sort(
      (a, b) =>
        new Date(a.next_due_at as string).getTime() -
        new Date(b.next_due_at as string).getTime()
    )
    .slice(0, 3);

  const earned = loyalty
    .filter((entry) => entry.type === "earned")
    .reduce((total, entry) => total + Number(entry.points), 0);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${customer.first_name}`}
        description="Here is what is happening with your pets and appointments."
        action={
          <Button asChild>
            <Link href="/dashboard/book">
              <CalendarPlus className="h-4 w-4" /> Book appointment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming visits" value={upcoming.length} icon={CalendarDays} />
        <StatCard label="Pets" value={pets.length} icon={PawPrint} tone="coral" />
        <StatCard
          label="Loyalty points"
          value={customer.loyalty_points ?? 0}
          hint={`${earned} earned in total`}
          icon={CreditCard}
          tone="amber"
        />
        <StatCard label="Completed visits" value={completed.length} icon={Sparkles} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming appointments</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/appointments">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length ? (
              upcoming.slice(0, 3).map((appointment) => {
                const shop = shopMap.get(Number(appointment.shop));
                const service = serviceMap.get(Number(appointment.service));
                const pet = petMap.get(Number(appointment.pet));
                return (
                  <Link
                    key={appointment.id}
                    href={`/dashboard/appointments/${appointment.id}`}
                    className="flex flex-col gap-3 rounded-2xl border bg-white p-4 transition hover:border-brand-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-black">{service?.name ?? "Appointment"}</p>
                        <p className="text-sm text-muted-foreground">
                          {pet?.name ?? "Your pet"} · {shop?.name ?? "Partner shop"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(appointment.start_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={appointment.status} />
                      <p className="text-sm font-black">{formatMoney(appointment.price)}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Book a grooming session or checkup and it will show up here."
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/book">Book now</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-4 w-4 text-brand-600" /> Next reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextReminder ? (
                <div>
                  <p className="text-sm font-semibold">
                    {nextReminder.message ?? "Appointment reminder"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(nextReminder.send_at)} · {nextReminder.channel}
                  </p>
                  <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    This reminder also appears in the notification bell in your header.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reminders scheduled. They appear automatically after you book.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Syringe className="h-4 w-4 text-coral-500" /> Vaccine watch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueVaccinations.length ? (
                dueVaccinations.map((vaccination) => {
                  const pet = petMap.get(Number(vaccination.pet));
                  const overdue = new Date(vaccination.next_due_at as string).getTime() < now;
                  return (
                    <div key={vaccination.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{vaccination.name}</p>
                        <p className="text-xs text-muted-foreground">{pet?.name}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          overdue
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {overdue ? "Overdue" : formatDate(vaccination.next_due_at, false)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No vaccinations due in the next 30 days.
                </p>
              )}
              {pets.length ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/dashboard/pets/${pets[0].id}`}>
                    <HeartPulse className="h-4 w-4" /> Open pet records
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-4 w-4 text-brand-600" /> Recent payments
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/appointments">All appointments</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Appointment #
                      {typeof transaction.appointment === "object"
                        ? transaction.appointment.id
                        : transaction.appointment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.date_created)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{formatMoney(transaction.amount)}</p>
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { href: "/shops", label: "Browse shops", icon: Store },
              { href: "/dashboard/pets", label: "Add a pet", icon: PawPrint },
              { href: "/dashboard/loyalty", label: "Redeem points", icon: CreditCard },
              { href: "/dashboard/profile", label: "Update profile", icon: UserRound },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col gap-2 rounded-2xl border bg-white p-4 text-sm font-semibold transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <action.icon className="h-5 w-5 text-brand-600" />
                {action.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
