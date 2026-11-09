"use client";

import { useState } from "react";
import { Activity, ReceiptText, RefreshCw, TrendingUp } from "lucide-react";
import { AnimatedMoney, AnimatedNumber } from "@/components/animated-money";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShopRevenueMetrics } from "@/lib/shop-metrics";
import { useLiveData } from "@/lib/use-live-data";
import { cn, formatMoney } from "@/lib/utils";

const ranges = [7, 14, 30] as const;

export function LiveRevenueStat({ initial }: { initial: ShopRevenueMetrics }) {
  const { data } = useLiveData("/api/shop/metrics", initial, 6_000);
  return (
    <StatCard
      label="Revenue this month"
      value={<AnimatedMoney value={data.revenue.monthGross} />}
      hint={`${data.revenue.monthBookings} paid bookings · live`}
      icon={TrendingUp}
    />
  );
}

export function LiveRevenuePanel({ initial }: { initial: ShopRevenueMetrics }) {
  const { data, live, refreshing, lastUpdated, refresh } = useLiveData(
    "/api/shop/metrics",
    initial,
    4_000
  );
  const [range, setRange] = useState<(typeof ranges)[number]>(14);
  const [mode, setMode] = useState<"revenue" | "bookings">("revenue");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visible = data.series.slice(-range);
  const selectedTotal = visible.reduce(
    (total, point) => total + (mode === "revenue" ? point.gross : point.bookings),
    0
  );
  const selectedBookings = visible.reduce((total, point) => total + point.bookings, 0);
  const graphWidth = 400;
  const graphHeight = 124;
  const graphPadding = 10;
  const graphDenominator = Math.max(visible.length - 1, 1);
  const maximum = Math.max(
    ...visible.map((point) => (mode === "revenue" ? point.gross : point.bookings)),
    1
  );
  const graphX = (index: number) =>
    graphPadding +
    (index / graphDenominator) * (graphWidth - graphPadding * 2);
  const graphY = (value: number) =>
    graphHeight -
    graphPadding -
    (value / maximum) * (graphHeight - graphPadding * 2);
  const graphPoints = visible
    .map(
      (point, index) =>
        `${graphX(index)},${graphY(mode === "revenue" ? point.gross : point.bookings)}`
    )
    .join(" ");
  const graphArea = [
    `M ${graphX(0)} ${graphHeight - graphPadding}`,
    ...visible.map(
      (point, index) =>
        `L ${graphX(index)} ${graphY(mode === "revenue" ? point.gross : point.bookings)}`
    ),
    `L ${graphX(visible.length - 1)} ${graphHeight - graphPadding}`,
    "Z",
  ].join(" ");
  const highlighted = activeIndex === null ? visible[visible.length - 1] : visible[activeIndex];

  function inspectGraph(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointer = ((event.clientX - bounds.left) / bounds.width) * graphWidth;
    const ratio =
      (pointer - graphPadding) / (graphWidth - graphPadding * 2);
    const index = Math.max(
      0,
      Math.min(visible.length - 1, Math.round(ratio * graphDenominator))
    );
    setActiveIndex(index);
  }

  return (
    <Card className="relative overflow-hidden border-brand-700 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 text-white shadow-soft">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-coral-400/20 blur-3xl motion-safe:animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-brand-300/15 blur-3xl motion-safe:animate-float" />

      <CardHeader className="relative flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-100/80">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60",
                  live ? "animate-ping bg-emerald-300" : "bg-amber-300"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  live ? "bg-emerald-300" : "bg-amber-300"
                )}
              />
            </span>
            {live ? "Realtime revenue" : "Reconnecting"}
          </p>
          <CardTitle className="mt-2 text-base text-white">Revenue pulse</CardTitle>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-brand-100 hover:bg-white/10 hover:text-white"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh revenue"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-white/15 bg-white/10 p-1">
            {(["revenue", "bookings"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setActiveIndex(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition",
                  mode === item
                    ? "bg-white text-brand-900"
                    : "text-brand-100/70 hover:text-white"
                )}
                aria-pressed={mode === item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-white/15 bg-white/10 p-1">
            {ranges.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setRange(days);
                  setActiveIndex(null);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-[10px] font-black transition",
                  range === days ? "bg-coral-500 text-white" : "text-brand-100/70 hover:text-white"
                )}
                aria-pressed={range === days}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-brand-100/65">
            Last {range} days · {mode === "revenue" ? "gross revenue" : "paid bookings"}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {mode === "revenue" ? (
              <AnimatedMoney value={selectedTotal} />
            ) : (
              <AnimatedNumber value={selectedTotal} />
            )}
          </p>
        </div>

        <div>
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="h-28 w-full cursor-crosshair overflow-visible"
            onMouseMove={inspectGraph}
            onMouseLeave={() => setActiveIndex(null)}
            role="img"
            aria-label={`Realtime ${mode === "revenue" ? "revenue" : "bookings"} graph for the last ${range} days`}
          >
            <defs>
              <linearGradient id="shop-revenue-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(255 255 255)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={graphPadding}
                x2={graphWidth - graphPadding}
                y1={graphPadding + ratio * (graphHeight - graphPadding * 2)}
                y2={graphPadding + ratio * (graphHeight - graphPadding * 2)}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="3 5"
              />
            ))}
            <path d={graphArea} fill="url(#shop-revenue-area)" />
            <polyline
              points={graphPoints}
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {highlighted ? (
              <>
                <line
                  x1={graphX(activeIndex ?? visible.length - 1)}
                  x2={graphX(activeIndex ?? visible.length - 1)}
                  y1={graphPadding}
                  y2={graphHeight - graphPadding}
                  stroke="rgba(255,255,255,0.45)"
                  strokeDasharray="3 4"
                />
                <circle
                  cx={graphX(activeIndex ?? visible.length - 1)}
                  cy={graphY(
                    mode === "revenue" ? highlighted.gross : highlighted.bookings
                  )}
                  r="4.5"
                  fill="#fb7a66"
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            ) : null}
          </svg>
          <div className="flex items-center justify-between text-[10px] font-semibold text-brand-100/50">
            <span>{visible[0]?.label}</span>
            <span>{visible[visible.length - 1]?.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
          <span className="font-semibold text-brand-100/70">
            {highlighted?.label ?? "No activity yet"}
          </span>
          <span className="font-black">
            {highlighted ? formatMoney(highlighted.gross) : formatMoney(0)}
            <span className="ml-2 font-semibold text-brand-100/65">
              {highlighted?.bookings ?? 0} booking{highlighted?.bookings === 1 ? "" : "s"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-100/60">Today</p>
            <p className="mt-1 text-sm font-black">
              <AnimatedMoney value={data.revenue.todayGross} />
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-100/60">
              Average
            </p>
            <p className="mt-1 text-sm font-black">
              <AnimatedMoney value={data.revenue.averageBooking} />
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-100/60">
              Bookings
            </p>
            <p className="mt-1 text-sm font-black">
              <AnimatedNumber value={selectedBookings} />
            </p>
          </div>
        </div>

        <p className="flex items-center justify-between gap-2 text-[10px] text-brand-100/55">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Updates every 4 seconds
          </span>
          <span className="flex items-center gap-1.5">
            <ReceiptText className="h-3 w-3" />
            {lastUpdated
              ? lastUpdated.toLocaleTimeString("en-PH", {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Connecting"}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
