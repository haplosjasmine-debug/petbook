"use client";

import { useCallback, useEffect, useState } from "react";
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
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminMetrics, RevenuePoint } from "@/lib/admin-metrics";
import { formatDate, formatMoney } from "@/lib/utils";

function compactMoney(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}k`;
  return `₱${Math.round(value)}`;
}

function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const width = 820;
  const height = 300;
  const padding = { top: 18, right: 18, bottom: 38, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(...series.map((point) => Math.max(point.gross, point.commission)), 1);
  const denominator = Math.max(series.length - 1, 1);

  const x = (index: number) => padding.left + (index / denominator) * plotWidth;
  const y = (value: number) => padding.top + (1 - value / maximum) * plotHeight;
  const baseline = padding.top + plotHeight;

  const grossPoints = series.map((point, index) => `${x(index)},${y(point.gross)}`).join(" ");
  const commissionPoints = series
    .map((point, index) => `${x(index)},${y(point.commission)}`)
    .join(" ");
  const areaPath = [
    `M ${x(0)} ${baseline}`,
    ...series.map((point, index) => `L ${x(index)} ${y(point.gross)}`),
    `L ${x(series.length - 1)} ${baseline}`,
    "Z",
  ].join(" ");

  const labelIndexes = new Set(
    Array.from({ length: 6 }, (_, index) =>
      Math.round((index / 5) * (series.length - 1))
    )
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Gross booking revenue
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-500" /> PetBook commission
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <defs>
          <linearGradient id="admin-revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = maximum * fraction;
          const lineY = y(value);
          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={lineY}
                y2={lineY}
                stroke="#dfe8e5"
                strokeWidth="1"
                strokeDasharray={fraction === 0 ? undefined : "4 5"}
              />
              <text x={padding.left - 10} y={lineY + 4} textAnchor="end" fontSize="10" fill="#7a8c88">
                {compactMoney(value)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#admin-revenue-fill)" />
        <polyline
          points={grossPoints}
          fill="none"
          stroke="#0f766e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={commissionPoints}
          fill="none"
          stroke="#f97316"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {series.map((point, index) => (
          <g key={point.date}>
            <circle cx={x(index)} cy={y(point.gross)} r="5" fill="transparent">
              <title>
                {point.label}: {formatMoney(point.gross)} gross · {formatMoney(point.commission)}{" "}
                commission · {point.bookings} bookings
              </title>
            </circle>
            {labelIndexes.has(index) ? (
              <text
                x={x(index)}
                y={height - 10}
                textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}
                fontSize="10"
                fill="#7a8c88"
              >
                {point.label}
              </text>
            ) : null}
          </g>
        ))}

        {series.length ? (
          <>
            <circle
              cx={x(series.length - 1)}
              cy={y(series[series.length - 1].gross)}
              r="5"
              fill="#0f766e"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle
              cx={x(series.length - 1)}
              cy={y(series[series.length - 1].commission)}
              r="4"
              fill="#f97316"
              stroke="#fff"
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function AdminDashboard({ initial }: { initial: AdminMetrics }) {
  const [metrics, setMetrics] = useState(initial);
  const [lastUpdated, setLastUpdated] = useState("");
  const [live, setLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/metrics", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load metrics.");
      const data = (await response.json()) as AdminMetrics;
      setMetrics(data);
      setLastUpdated(
        new Date(data.generatedAt).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setLive(true);
    } catch {
      setLive(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(load, 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

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
          {live ? "Live" : "Reconnecting"} · updates every 10 seconds
          {lastUpdated ? <span className="font-normal">· {lastUpdated}</span> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh now
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatMoney(revenue.gross)}
          hint={`${revenue.paidBookings} paid bookings`}
          icon={TrendingUp}
        />
        <StatCard
          label="PetBook commission"
          value={formatMoney(revenue.commission)}
          hint={`${formatMoney(revenue.pendingCommission)} pending settlement`}
          icon={Coins}
          tone="coral"
        />
        <StatCard
          label="Commission collected"
          value={formatMoney(revenue.settledCommission)}
          hint={`${formatMoney(revenue.onlineCommissionPaid)} via online checkout`}
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Today's revenue"
          value={formatMoney(revenue.todayGross)}
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
