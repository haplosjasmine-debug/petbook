import { shopTransactions } from "@/lib/queries";
import type { Transaction } from "@/lib/types";

export type ShopRevenuePoint = {
  date: string;
  label: string;
  gross: number;
  bookings: number;
};

export type ShopRevenueMetrics = {
  generatedAt: string;
  revenue: {
    todayGross: number;
    todayBookings: number;
    monthGross: number;
    monthBookings: number;
    averageBooking: number;
    last30Gross: number;
  };
  series: ShopRevenuePoint[];
};

function dateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildSeries(now: Date) {
  const series = new Map<string, ShopRevenuePoint>();
  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    series.set(dateKey(date), {
      date: dateKey(date),
      label: date.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      gross: 0,
      bookings: 0,
    });
  }
  return series;
}

export function emptyShopRevenueMetrics(): ShopRevenueMetrics {
  const now = new Date();
  return {
    generatedAt: now.toISOString(),
    revenue: {
      todayGross: 0,
      todayBookings: 0,
      monthGross: 0,
      monthBookings: 0,
      averageBooking: 0,
      last30Gross: 0,
    },
    series: [...buildSeries(now).values()],
  };
}

export async function getShopRevenueMetrics(shopId: number): Promise<ShopRevenueMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = dateKey(now);
  const seriesMap = buildSeries(now);
  const transactions = await shopTransactions(
    shopId,
    "&filter[status][_eq]=paid",
    1000
  );

  const revenue = {
    todayGross: 0,
    todayBookings: 0,
    monthGross: 0,
    monthBookings: 0,
    averageBooking: 0,
    last30Gross: 0,
  };

  transactions.forEach((transaction: Transaction) => {
    const amount = Number(transaction.amount ?? 0);
    const paidAt = new Date(transaction.paid_at ?? transaction.date_created);
    const key = dateKey(paidAt);
    const point = seriesMap.get(key);

    if (point) {
      point.gross += amount;
      point.bookings += 1;
    }

    if (key === today) {
      revenue.todayGross += amount;
      revenue.todayBookings += 1;
    }

    if (paidAt >= startOfMonth) {
      revenue.monthGross += amount;
      revenue.monthBookings += 1;
    }
  });

  const series = [...seriesMap.values()];
  revenue.last30Gross = series.reduce((total, point) => total + point.gross, 0);
  revenue.averageBooking = revenue.monthBookings
    ? revenue.monthGross / revenue.monthBookings
    : 0;

  return {
    generatedAt: now.toISOString(),
    revenue,
    series,
  };
}
