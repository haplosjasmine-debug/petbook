"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Coins,
  CreditCard,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { AnimatedMoney } from "@/components/animated-money";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminMetrics } from "@/lib/admin-metrics";
import { useLiveData } from "@/lib/use-live-data";
import { formatDate, formatMoney } from "@/lib/utils";

export function AdminDashboard({ initial }: { initial: AdminMetrics }) {
  const { data: metrics, live, refreshing, lastUpdated, refresh } = useLiveData(
    "/api/admin/metrics",
    initial,
    4_000
  );
  const { revenue, counts, series, shops, commissionPayments } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${
                live ? "animate-ping bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                live ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          {live ? "Realtime" : "Reconnecting"} · refreshes every 4 seconds
          {lastUpdated ? (
            <span className="font-normal">
              ·{" "}
              {lastUpdated.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh now
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={<AnimatedMoney value={revenue.gross} />}
          hint={`${revenue.paidBookings} paid bookings`}
          icon={TrendingUp}
        />
        <StatCard
          label="PetBook commission"
          value={<AnimatedMoney value={revenue.commission} />}
          hint={`${formatMoney(revenue.pendingCommission)} pending settlement`}
          icon={Coins}
          tone="coral"
        />
        <StatCard
          label="Commission collected"
          value={<AnimatedMoney value={revenue.settledCommission} />}
          hint={`${formatMoney(revenue.onlineCommissionPaid)} via online checkout`}
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Today's revenue"
          value={<AnimatedMoney value={revenue.todayGross} />}
          hint={`${formatMoney(revenue.monthGross)} this month`}
          icon={Activity}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.4fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Revenue, live</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Daily gross bookings and platform commission for the last 30 days.
              </p>
            </div>
            <Link
              href="/shop/reports"
              className="hidden items-center gap-1 text-xs font-semibold text-brand-700 hover:underline sm:inline-flex"
            >
              Shop reports <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <RevenueChart series={series} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Store className="h-4 w-4" /> Partner shops
                </span>
                <span className="font-black">{counts.activeShops}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" /> Total shops
                </span>
                <span className="font-semibold">{counts.shops}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> Customers
                </span>
                <span className="font-semibold">{counts.customers}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" /> Upcoming visits
                </span>
                <span className="font-semibold">{counts.upcomingAppointments}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Net to shops</span>
                <span className="font-semibold">{formatMoney(revenue.net)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Commission due</span>
                <span className="font-semibold text-coral-600">
                  {formatMoney(revenue.pendingCommission)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Platform revenue
                </span>
                <span className="text-lg font-black">{formatMoney(revenue.commission)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top shops by revenue</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Bookings</th>
                  <th>Gross</th>
                  <th>Commission</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {shops.length ? (
                  shops.map((shop) => (
                    <tr key={shop.id}>
                      <td>
                        <p className="font-semibold">{shop.name}</p>
                        <p className="text-xs text-muted-foreground">{shop.city ?? "Philippines"}</p>
                      </td>
                      <td>{shop.bookings}</td>
                      <td className="font-semibold">{formatMoney(shop.gross)}</td>
                      <td>{formatMoney(shop.commission)}</td>
                      <td className={shop.pendingCommission ? "font-semibold text-coral-600" : ""}>
                        {formatMoney(shop.pendingCommission)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Revenue appears here after the first paid booking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent commission payments</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {commissionPayments.length ? (
                  commissionPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-semibold">{payment.shop}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(payment.paidAt ?? payment.createdAt, false)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No online commission payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
