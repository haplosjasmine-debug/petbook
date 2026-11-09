import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Coins,
  Scissors,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { CheckInForm } from "@/components/shop/check-in-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { commissionSummary } from "@/lib/payments";
import {
  customersByIds,
  petsByIds,
  servicesByIds,
  shopAppointments,
  shopServices,
  shopStaff,
  shopTransactions,
} from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Business overview" };

export default async function ShopDashboardPage() {
  const session = await requireShop();
  const shop = session.shop!;

  const [appointments, services, staff, transactions] = await Promise.all([
    shopAppointments(shop.id).catch(() => []),
    shopServices(shop.id).catch(() => []),
    shopStaff(shop.id).catch(() => []),
    shopTransactions(shop.id, "", 500).catch(() => []),
  ]);

  const serviceIds = [...new Set(appointments.map((appointment) => Number(appointment.service)))];
  const customerIds = [...new Set(appointments.map((appointment) => Number(appointment.customer)))];
  const petIds = [...new Set(appointments.map((appointment) => Number(appointment.pet)))];

  const [serviceRows, customerRows, petRows] = await Promise.all([
    servicesByIds(serviceIds).catch(() => []),
    customersByIds(customerIds).catch(() => []),
    petsByIds(petIds).catch(() => []),
  ]);

  const serviceMap = new Map(serviceRows.map((service) => [service.id, service]));
  const customerMap = new Map(customerRows.map((customer) => [customer.id, customer]));
  const petMap = new Map(petRows.map((pet) => [pet.id, pet]));

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const today = appointments
    .filter((appointment) => {
      const start = new Date(appointment.start_at);
      return start >= startOfDay && start <= endOfDay && appointment.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
  const upcoming = appointments
    .filter(
      (appointment) =>
        activeStatuses.includes(appointment.status) &&
        new Date(appointment.end_at).getTime() >= Date.now() - 60 * 60_000
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTransactions = transactions.filter(
    (transaction) =>
      transaction.status === "paid" && new Date(transaction.date_created) >= startOfMonth
  );
  const monthSummary = commissionSummary(monthTransactions);
  const pendingCommission = transactions
    .filter(
      (transaction) =>
        transaction.status === "paid" && transaction.commission_status === "pending"
    )
    .reduce((total, transaction) => total + Number(transaction.commission_amount), 0);

  return (
    <>
      <PageHeader
        eyebrow={shop.city ? `Business · ${shop.city}` : "Business"}
        title={shop.name}
        description="A calm snapshot of today's visits, revenue, and your team."
        action={
          <Button asChild>
            <Link href="/shop/appointments">
              <CalendarDays className="h-4 w-4" /> Manage appointments
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's visits" value={today.length} icon={CalendarDays} />
        <StatCard label="Upcoming" value={upcoming.length} icon={Clock} tone="blue" />
        <StatCard
          label="Revenue this month"
          value={formatMoney(monthSummary.gross)}
          hint={`${monthSummary.count} paid bookings`}
          icon={TrendingUp}
        />
        <StatCard
          label="Commission owed"
          value={formatMoney(pendingCommission)}
          hint="Pending settlement"
          icon={Coins}
          tone="coral"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Today's schedule</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/shop/appointments">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {today.length ? (
              today.map((appointment) => {
                const customer = customerMap.get(Number(appointment.customer));
                const pet = petMap.get(Number(appointment.pet));
                const service = serviceMap.get(Number(appointment.service));
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Scissors className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-black">
                          {service?.name ?? `Appointment #${appointment.id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pet?.name} ·{" "}
                          {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
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
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No visits today"
                description="When a customer books for today, their appointment will appear here."
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick check-in</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckInForm />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the customer's booking code or scan it at reception.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">This month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Gross revenue</span>
                <span className="font-semibold">{formatMoney(monthSummary.gross)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins className="h-4 w-4" /> PetBook commission
                </span>
                <span className="font-semibold text-coral-600">
                  −{formatMoney(monthSummary.commission)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Net payout
                </span>
                <span className="font-black">{formatMoney(monthSummary.net)}</span>
              </div>
              <div className="grid gap-2">
                <Button asChild variant="soft" size="sm" className="w-full">
                  <Link href="/shop/reports">Open reports</Link>
                </Button>
                {pendingCommission > 0 ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/shop/commissions">
                      <Coins className="h-4 w-4" /> Pay commission online
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> Active staff
                </span>
                <span className="font-semibold">
                  {staff.filter((member) => member.active).length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Scissors className="h-4 w-4" /> Active services
                </span>
                <span className="font-semibold">
                  {services.filter((service) => service.active).length}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/shop/staff">Manage staff</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/shop/services", label: "Add or edit services", icon: Scissors },
          { href: "/shop/appointments", label: "Update appointment status", icon: CheckCircle2 },
          { href: "/shop/commissions", label: "Pay PetBook commission", icon: Coins },
          { href: "/shop/reports", label: "Review revenue", icon: TrendingUp },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl border bg-white p-4 text-sm font-semibold transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <action.icon className="h-5 w-5" />
            </span>
            {action.label}
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}
