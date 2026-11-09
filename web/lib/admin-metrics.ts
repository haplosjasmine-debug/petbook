import { listItems } from "@/lib/directus";
import type { Appointment, CommissionPayment, Customer, Shop, Transaction } from "@/lib/types";

export type RevenuePoint = {
  date: string;
  label: string;
  gross: number;
  commission: number;
  bookings: number;
};

export type ShopPerformance = {
  id: number;
  name: string;
  city: string | null;
  gross: number;
  commission: number;
  pendingCommission: number;
  bookings: number;
};

export type CommissionPaymentSummary = {
  id: number;
  shop: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type AdminMetrics = {
  generatedAt: string;
  revenue: {
    gross: number;
    commission: number;
    net: number;
    pendingCommission: number;
    settledCommission: number;
    onlineCommissionPaid: number;
    todayGross: number;
    monthGross: number;
    paidBookings: number;
  };
  counts: {
    shops: number;
    activeShops: number;
    customers: number;
    upcomingAppointments: number;
  };
  series: RevenuePoint[];
  shops: ShopPerformance[];
  commissionPayments: CommissionPaymentSummary[];
};

function dateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shopName(value: number | Shop, shops: Map<number, Shop>) {
  if (typeof value === "object") return value.name;
  return shops.get(Number(value))?.name ?? `Shop #${value}`;
}

export function emptyAdminMetrics(): AdminMetrics {
  const now = new Date();
  const series = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - index));
    return {
      date: dateKey(date),
      label: date.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      gross: 0,
      commission: 0,
      bookings: 0,
    };
  });

  return {
    generatedAt: now.toISOString(),
    revenue: {
      gross: 0,
      commission: 0,
      net: 0,
      pendingCommission: 0,
      settledCommission: 0,
      onlineCommissionPaid: 0,
      todayGross: 0,
      monthGross: 0,
      paidBookings: 0,
    },
    counts: { shops: 0, activeShops: 0, customers: 0, upcomingAppointments: 0 },
    series,
    shops: [],
    commissionPayments: [],
  };
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = dateKey(now);

  const [transactions, shops, customers, appointments, commissionPayments] = await Promise.all([
    listItems<Transaction>(
      "transactions",
      "filter[status][_eq]=paid&sort=-date_created&limit=2000"
    ).catch(() => []),
    listItems<Shop>("shops", "sort=name&limit=500").catch(() => []),
    listItems<Customer>("customers", "fields=id&limit=5000").catch(() => []),
    listItems<Appointment>(
      "appointments",
      `filter[status][_in]=pending,confirmed,checked_in,in_progress&filter[start_at][_gte]=${encodeURIComponent(
        now.toISOString()
      )}&fields=id&limit=2000`
    ).catch(() => []),
    listItems<CommissionPayment>(
      "commission_payments",
      "fields=*,shop.id,shop.name&sort=-date_created&limit=200"
    ).catch(() => []),
  ]);

  const shopMap = new Map(shops.map((shop) => [shop.id, shop]));
  const seriesMap = new Map<string, RevenuePoint>();
  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    seriesMap.set(dateKey(date), {
      date: dateKey(date),
      label: date.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      gross: 0,
      commission: 0,
      bookings: 0,
    });
  }

  const revenue = {
    gross: 0,
    commission: 0,
    net: 0,
    pendingCommission: 0,
    settledCommission: 0,
    onlineCommissionPaid: 0,
    todayGross: 0,
    monthGross: 0,
    paidBookings: transactions.length,
  };

  const performance = new Map<number, ShopPerformance>();

  transactions.forEach((transaction) => {
    const gross = Number(transaction.amount ?? 0);
    const commission = Number(transaction.commission_amount ?? 0);
    const net = Number(transaction.net_amount ?? 0);
    const transactionDate = new Date(transaction.paid_at ?? transaction.date_created);
    const key = dateKey(transactionDate);

    revenue.gross += gross;
    revenue.commission += commission;
    revenue.net += net;

    if (transaction.commission_status === "pending") revenue.pendingCommission += commission;
    if (transaction.commission_status === "settled") revenue.settledCommission += commission;
    if (key === today) revenue.todayGross += gross;
    if (transactionDate >= startOfMonth) revenue.monthGross += gross;

    const point = seriesMap.get(key);
    if (point) {
      point.gross += gross;
      point.commission += commission;
      point.bookings += 1;
    }

    const shopId = typeof transaction.shop === "object" ? transaction.shop.id : Number(transaction.shop);
    const current = performance.get(shopId) ?? {
      id: shopId,
      name: shopName(transaction.shop, shopMap),
      city: shopMap.get(shopId)?.city ?? null,
      gross: 0,
      commission: 0,
      pendingCommission: 0,
      bookings: 0,
    };
    current.gross += gross;
    current.commission += commission;
    current.bookings += 1;
    if (transaction.commission_status === "pending") current.pendingCommission += commission;
    performance.set(shopId, current);
  });

  revenue.onlineCommissionPaid = commissionPayments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  return {
    generatedAt: now.toISOString(),
    revenue,
    counts: {
      shops: shops.length,
      activeShops: shops.filter((shop) => shop.active).length,
      customers: customers.length,
      upcomingAppointments: appointments.length,
    },
    series: [...seriesMap.values()],
    shops: [...performance.values()].sort((a, b) => b.gross - a.gross).slice(0, 8),
    commissionPayments: commissionPayments.slice(0, 10).map((payment) => ({
      id: payment.id,
      shop: shopName(payment.shop, shopMap),
      amount: Number(payment.amount ?? 0),
      status: payment.status,
      paidAt: payment.paid_at,
      createdAt: payment.date_created,
    })),
  };
}
