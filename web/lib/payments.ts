import { appConfig } from "@/lib/config";
import { calculateCommission } from "@/lib/commission";
import {
  createItem,
  getItem,
  listItems,
  updateItem,
} from "@/lib/directus";
import { pointsForAmount } from "@/lib/loyalty";
import { notifyCustomer } from "@/lib/notifications";
import type {
  Appointment,
  CommissionPayment,
  Customer,
  LoyaltyPoint,
  Reminder,
  Shop,
  Transaction,
} from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export async function appointmentTransaction(appointmentId: number) {
  const rows = await listItems<Transaction>(
    "transactions",
    `filter[appointment][_eq]=${appointmentId}&limit=1&sort=-date_created`
  );
  return rows[0] ?? null;
}

export async function ensurePendingTransaction(appointment: Appointment) {
  const existing = await appointmentTransaction(appointment.id);
  if (existing) return existing;

  const shop =
    typeof appointment.shop === "object"
      ? appointment.shop
      : await getItem<{ data: Shop }>("shops", appointment.shop).then((result) => result.data);

  const commission = calculateCommission(appointment.price, shop.commission_rate);

  return createItem<Transaction>("transactions", {
    appointment: appointment.id,
    shop: shop.id,
    customer: typeof appointment.customer === "object" ? appointment.customer.id : appointment.customer,
    amount: commission.amount,
    commission_rate: commission.commissionRate,
    commission_amount: commission.commissionAmount,
    net_amount: commission.netAmount,
    status: "pending",
    commission_status: "pending",
    provider: null,
    method: null,
    reference: null,
    paid_at: null,
  });
}

async function awardLoyalty(appointment: Appointment, customer: Customer) {
  const existing = await listItems<LoyaltyPoint>(
    "loyalty_points",
    `filter[appointment][_eq]=${appointment.id}&filter[type][_eq]=earned&limit=1`
  );
  if (existing.length) return;

  const points = pointsForAmount(appointment.price);
  if (points <= 0) return;

  await createItem("loyalty_points", {
    customer: customer.id,
    appointment: appointment.id,
    points,
    type: "earned",
    description: `Earned for appointment #${appointment.id}`,
  });

  await updateItem("customers", customer.id, {
    loyalty_points: Number(customer.loyalty_points ?? 0) + points,
  });
}

export async function completeAppointment(appointmentId: number) {
  const appointment = await getItem<{ data: Appointment }>("appointments", appointmentId, "?fields=*").then(
    (result) => result.data
  );

  if (!appointment) throw new Error("Appointment not found.");
  if (appointment.status === "cancelled") {
    throw new Error("A cancelled appointment cannot be completed.");
  }

  const customer =
    typeof appointment.customer === "object"
      ? appointment.customer
      : await getItem<{ data: Customer }>("customers", appointment.customer, "?fields=*").then(
          (result) => result.data
        );

  const shop =
    typeof appointment.shop === "object"
      ? appointment.shop
      : await getItem<{ data: Shop }>("shops", appointment.shop, "?fields=*").then(
          (result) => result.data
        );

  let transaction = await ensurePendingTransaction(appointment);

  if (transaction.status !== "paid") {
    transaction = await updateItem<Transaction>("transactions", transaction.id, {
      status: "paid",
      method: transaction.method ?? "cash",
      paid_at: new Date().toISOString(),
    });
  }

  if (appointment.status !== "completed") {
    await updateItem("appointments", appointment.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  await awardLoyalty(appointment, customer);

  const existingFollowUp = await listItems<Reminder>(
    "reminders",
    `filter[appointment][_eq]=${appointment.id}&filter[type][_eq]=follow_up&limit=1`
  );
  if (!existingFollowUp.length) {
    await createItem("reminders", {
      appointment: appointment.id,
      type: "follow_up",
      send_at: new Date(Date.now() + 3 * 24 * 60 * 60_000).toISOString(),
      status: "scheduled",
      channel: customer.phone ? "sms" : "email",
      message: `How was your visit to ${shop.name}? We would love your feedback.`,
    });
  }

  await notifyCustomer({
    customer,
    shop,
    appointment,
    subject: "Visit completed",
    body: `Thanks for visiting ${shop.name}! You earned ${pointsForAmount(
      appointment.price
    )} loyalty points. Total paid: ${formatMoney(appointment.price)}.`,
  });

  return { appointment, transaction };
}

export async function markTransactionPaid(options: {
  transactionId: number;
  provider: string;
  method?: string | null;
  reference?: string | null;
}) {
  const { transactionId, provider, method, reference } = options;
  const transaction = await updateItem<Transaction>("transactions", transactionId, {
    status: "paid",
    provider,
    method: method ?? "online",
    reference: reference ?? null,
    paid_at: new Date().toISOString(),
  });

  const appointment =
    typeof transaction.appointment === "object"
      ? transaction.appointment
      : await getItem<{ data: Appointment }>("appointments", transaction.appointment, "?fields=*").then(
          (result) => result.data
        );

  if (appointment && appointment.status === "pending") {
    await updateItem("appointments", appointment.id, { status: "confirmed" });
  }

  return transaction;
}

export async function settleCommission(transactionId: number) {
  return updateItem<Transaction>("transactions", transactionId, {
    commission_status: "settled",
  });
}

export async function pendingCommissionTransactions(shopId: number) {
  return listItems<Transaction>(
    "transactions",
    `filter[shop][_eq]=${shopId}&filter[status][_eq]=paid&filter[commission_status][_eq]=pending&sort=-date_created&limit=500`
  );
}

export function pendingCommissionTotal(transactions: Transaction[]) {
  return transactions.reduce(
    (total, transaction) => total + Number(transaction.commission_amount ?? 0),
    0
  );
}

export async function settleShopCommission(shopId: number) {
  const pending = await pendingCommissionTransactions(shopId);
  if (!pending.length) return { settled: 0, amount: 0 };

  await Promise.all(
    pending.map((transaction) =>
      updateItem("transactions", transaction.id, { commission_status: "settled" })
    )
  );

  return {
    settled: pending.length,
    amount: pendingCommissionTotal(pending),
  };
}

export async function markCommissionPaid(options: {
  paymentId: number;
  provider: string;
  method?: string | null;
  reference?: string | null;
}) {
  const payment = await getItem<{ data: CommissionPayment }>(
    "commission_payments",
    options.paymentId,
    "?fields=*"
  ).then((result) => result.data);

  if (!payment) throw new Error("Commission payment not found.");

  if (payment.status !== "paid") {
    await updateItem<CommissionPayment>("commission_payments", payment.id, {
      status: "paid",
      provider: options.provider,
      method: options.method ?? "online",
      reference: options.reference ?? payment.reference,
      paid_at: new Date().toISOString(),
    });
  }

  const shopId = typeof payment.shop === "object" ? payment.shop.id : payment.shop;
  const settled = await settleShopCommission(shopId);

  return { payment, ...settled };
}

export async function commissionPaymentsForShop(shopId: number, limit = 50) {
  return listItems<CommissionPayment>(
    "commission_payments",
    `filter[shop][_eq]=${shopId}&sort=-date_created&limit=${limit}`
  );
}

export function commissionSummary(transactions: Transaction[]) {
  const paid = transactions.filter((transaction) => transaction.status === "paid");
  return {
    gross: paid.reduce((total, transaction) => total + Number(transaction.amount), 0),
    commission: paid.reduce(
      (total, transaction) => total + Number(transaction.commission_amount),
      0
    ),
    net: paid.reduce((total, transaction) => total + Number(transaction.net_amount), 0),
    count: paid.length,
  };
}

export function defaultCommissionRate() {
  return appConfig.commissionRate;
}
