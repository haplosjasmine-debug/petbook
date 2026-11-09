import Link from "next/link";
import { CalendarRange, Coins, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { commissionSummary } from "@/lib/payments";
import {
  appointmentsByIds,
  servicesByIds,
  shopAppointments,
  shopTransactions,
} from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { formatDate, formatDateInput, formatMoney } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ShopReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireShop();
  const shop = session.shop!;
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = params.from || formatDateInput(defaultFrom);
  const to = params.to || formatDateInput(now);

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59.999`);

  const [transactions, completedAppointments] = await Promise.all([
    shopTransactions(
      shop.id,
      `&filter[date_created][_gte]=${encodeURIComponent(
        fromDate.toISOString()
      )}&filter[date_created][_lte]=${encodeURIComponent(toDate.toISOString())}`,
      500
    ).catch(() => []),
    shopAppointments(
      shop.id,
      `&filter[status][_eq]=completed&filter[start_at][_gte]=${encodeURIComponent(
        fromDate.toISOString()
      )}&filter[start_at][_lte]=${encodeURIComponent(toDate.toISOString())}`
    ).catch(() => []),
  ]);

  const paid = transactions.filter((transaction) => transaction.status === "paid");
  const summary = commissionSummary(paid);
  const pending = paid
    .filter((transaction) => transaction.commission_status === "pending")
    .reduce((total, transaction) => total + Number(transaction.commission_amount), 0);

  const appointmentIds = paid.map((transaction) => Number(transaction.appointment));
  const appointmentRows = await appointmentsByIds(appointmentIds).catch(() => []);
  const appointmentMap = new Map(
    appointmentRows.map((appointment) => [appointment.id, appointment])
  );

  const serviceIds = [
    ...new Set(
      appointmentRows
        .map((appointment) => Number(appointment.service))
        .filter((id) => Number.isFinite(id))
    ),
  ];
  const serviceRows = await servicesByIds(serviceIds).catch(() => []);
  const serviceMap = new Map(serviceRows.map((service) => [service.id, service]));

  const byService = new Map<number, { name: string; count: number; revenue: number }>();
  paid.forEach((transaction) => {
    const appointment = appointmentMap.get(Number(transaction.appointment));
    if (!appointment) return;
    const serviceId = Number(appointment.service);
    const service = serviceMap.get(serviceId);
    const current = byService.get(serviceId) ?? {
      name: service?.name ?? `Service #${serviceId}`,
      count: 0,
      revenue: 0,
    };
    current.count += 1;
    current.revenue += Number(transaction.amount);
    byService.set(serviceId, current);
  });
  const topServices = [...byService.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const daily = new Map<string, number>();
  paid.forEach((transaction) => {
    const key = new Date(transaction.date_created).toISOString().slice(0, 10);
    daily.set(key, (daily.get(key) ?? 0) + Number(transaction.amount));
  });
  const dailyRows = [...daily.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30);
  const maxDaily = Math.max(...dailyRows.map((row) => row[1]), 1);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Reports & payouts"
        description="Track revenue, PetBook commission, and your net payout."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/shop/appointments?status=completed">View completed appointments</Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" action="/shop/reports">
            <div className="space-y-2">
              <Label htmlFor="report-from">From</Label>
              <Input id="report-from" type="date" name="from" defaultValue={from} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-to">To</Label>
              <Input id="report-to" type="date" name="to" defaultValue={to} />
            </div>
            <Button type="submit">
              <CalendarRange className="h-4 w-4" /> Apply range
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross revenue" value={formatMoney(summary.gross)} icon={TrendingUp} />
        <StatCard
          label="PetBook commission"
          value={formatMoney(summary.commission)}
          hint={`${Number(shop.commission_rate)}% of completed bookings`}
          icon={Coins}
          tone="coral"
        />
        <StatCard label="Net payout" value={formatMoney(summary.net)} icon={Wallet} tone="blue" />
        <StatCard
          label="Paid bookings"
          value={summary.count}
          hint={`${completedAppointments.length} completed visits`}
          icon={ReceiptText}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyRows.length ? (
              <div className="flex h-56 items-end gap-1.5">
                {dailyRows.map(([date, amount]) => (
                  <div key={date} className="group flex h-full flex-1 flex-col justify-end">
                    <div
                      className="relative rounded-t-md bg-brand-500 transition hover:bg-brand-600"
                      style={{ height: `${Math.max((amount / maxDaily) * 100, 4)}%` }}
                    >
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-brand-900 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                        {formatMoney(amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No paid transactions in this range.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Showing revenue by payment date for the selected range (up to 30 days).
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Gross</span>
                <span className="font-semibold">{formatMoney(summary.gross)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Commission</span>
                <span className="font-semibold text-coral-600">
                  −{formatMoney(summary.commission)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="font-semibold">Net payout</span>
                <span className="text-lg font-black">{formatMoney(summary.net)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs">
                <span className="text-muted-foreground">Commission pending settlement</span>
                <span className="font-semibold">{formatMoney(pending)}</span>
              </div>
              {pending > 0 ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/shop/commissions">
                    <Coins className="h-4 w-4" /> Pay commission online
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topServices.length ? (
                topServices.map((service, index) => (
                  <div key={`${service.name}-${index}`} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.count} bookings</p>
                    </div>
                    <p className="text-sm font-bold">{formatMoney(service.revenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No paid services yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Appointment</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Net</th>
                <th>Status</th>
                <th>Settlement</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(transaction.date_created, false)}
                    </td>
                    <td>
                      #
                      {typeof transaction.appointment === "object"
                        ? transaction.appointment.id
                        : transaction.appointment}
                    </td>
                    <td className="font-semibold">{formatMoney(transaction.amount)}</td>
                    <td className="text-coral-600">
                      −{formatMoney(transaction.commission_amount)}
                    </td>
                    <td className="font-semibold">{formatMoney(transaction.net_amount)}</td>
                    <td>
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td>
                      <StatusBadge status={transaction.commission_status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No transactions in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
