"use client";

import { useState } from "react";
import type { RevenuePoint } from "@/lib/admin-metrics";
import { cn, formatMoney } from "@/lib/utils";

function compactMoney(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}k`;
  return `₱${Math.round(value)}`;
}

type Focus = "both" | "gross" | "commission";

export function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const [range, setRange] = useState(30);
  const [focus, setFocus] = useState<Focus>("both");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visible = series.slice(-range);
  const width = 820;
  const height = 300;
  const padding = { top: 18, right: 18, bottom: 38, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(
    ...visible.map((point) => Math.max(point.gross, point.commission)),
    1
  );
  const denominator = Math.max(visible.length - 1, 1);

  const x = (index: number) => padding.left + (index / denominator) * plotWidth;
  const y = (value: number) => padding.top + (1 - value / maximum) * plotHeight;
  const baseline = padding.top + plotHeight;

  const grossPoints = visible.map((point, index) => `${x(index)},${y(point.gross)}`).join(" ");
  const commissionPoints = visible
    .map((point, index) => `${x(index)},${y(point.commission)}`)
    .join(" ");
  const areaPath = [
    `M ${x(0)} ${baseline}`,
    ...visible.map((point, index) => `L ${x(index)} ${y(point.gross)}`),
    `L ${x(visible.length - 1)} ${baseline}`,
    "Z",
  ].join(" ");

  const labelIndexes = new Set(
    Array.from({ length: 6 }, (_, index) =>
      Math.round((index / 5) * (visible.length - 1))
    )
  );
  const active = activeIndex === null ? null : visible[activeIndex];
  const activeX = activeIndex === null ? 0 : x(activeIndex);
  const tooltipShift =
    activeIndex === 0
      ? ""
      : activeIndex === visible.length - 1
        ? "-translate-x-full"
        : "-translate-x-1/2";

  function inspect(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointer = ((event.clientX - bounds.left) / bounds.width) * width;
    const ratio = (pointer - padding.left) / plotWidth;
    const index = Math.max(
      0,
      Math.min(visible.length - 1, Math.round(ratio * denominator))
    );
    setActiveIndex(index);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "both" as const, label: "Both", color: "bg-brand-600" },
            { key: "gross" as const, label: "Gross", color: "bg-brand-600" },
            { key: "commission" as const, label: "Commission", color: "bg-coral-500" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFocus(item.key);
                setActiveIndex(null);
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                focus === item.key
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-transparent text-muted-foreground hover:bg-secondary"
              )}
              aria-pressed={focus === item.key}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-full bg-secondary p-1">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                setRange(days);
                setActiveIndex(null);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-black transition",
                range === days
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={range === days}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {active ? (
          <div
            className={cn(
              "pointer-events-none absolute top-2 z-10 w-44 rounded-xl border bg-white/95 p-3 text-xs shadow-soft backdrop-blur",
              tooltipShift
            )}
            style={{ left: `${(activeX / width) * 100}%` }}
          >
            <p className="font-black">{active.label}</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p className="flex justify-between gap-2">
                <span>Gross</span>
                <span className="font-semibold text-foreground">{formatMoney(active.gross)}</span>
              </p>
              <p className="flex justify-between gap-2">
                <span>Commission</span>
                <span className="font-semibold text-coral-600">
                  {formatMoney(active.commission)}
                </span>
              </p>
              <p className="flex justify-between gap-2 border-t pt-1">
                <span>Bookings</span>
                <span className="font-semibold text-foreground">{active.bookings}</span>
              </p>
            </div>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full cursor-crosshair touch-none"
          role="img"
          onMouseMove={inspect}
          onMouseLeave={() => setActiveIndex(null)}
        >
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
                <text
                  x={padding.left - 10}
                  y={lineY + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#7a8c88"
                >
                  {compactMoney(value)}
                </text>
              </g>
            );
          })}

          {focus !== "commission" ? <path d={areaPath} fill="url(#admin-revenue-fill)" /> : null}
          <polyline
            key={`gross-${range}-${focus}`}
            points={grossPoints}
            fill="none"
            stroke="#0f766e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={focus === "commission" ? 0.18 : 1}
            className="transition-opacity duration-300"
          />
          <polyline
            key={`commission-${range}-${focus}`}
            points={commissionPoints}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={focus === "gross" ? 0.2 : 1}
            className="transition-opacity duration-300"
          />

          {visible.map((point, index) => (
            <g key={point.date}>
              <circle cx={x(index)} cy={y(point.gross)} r="5" fill="transparent">
                <title>
                  {point.label}: {formatMoney(point.gross)} gross ·{" "}
                  {formatMoney(point.commission)} commission · {point.bookings} bookings
                </title>
              </circle>
              {labelIndexes.has(index) ? (
                <text
                  x={x(index)}
                  y={height - 10}
                  textAnchor={
                    index === 0 ? "start" : index === visible.length - 1 ? "end" : "middle"
                  }
                  fontSize="10"
                  fill="#7a8c88"
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          ))}

          {activeIndex !== null ? (
            <line
              x1={activeX}
              x2={activeX}
              y1={padding.top}
              y2={baseline}
              stroke="#0b5a54"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.5"
            />
          ) : null}

          {active ? (
            <>
              <circle
                cx={activeX}
                cy={y(active.gross)}
                r="5.5"
                fill="#0f766e"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={activeX}
                cy={y(active.commission)}
                r="4.5"
                fill="#f97316"
                stroke="#fff"
                strokeWidth="2"
              />
            </>
          ) : visible.length ? (
            <>
              <circle
                cx={x(visible.length - 1)}
                cy={y(visible[visible.length - 1].gross)}
                r="5"
                fill="#0f766e"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={x(visible.length - 1)}
                cy={y(visible[visible.length - 1].commission)}
                r="4"
                fill="#f97316"
                stroke="#fff"
                strokeWidth="2"
              />
            </>
          ) : null}
        </svg>

        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Hover the chart to inspect a day
        </p>
      </div>
    </div>
  );
}
