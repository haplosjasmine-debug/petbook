import { appConfig } from "@/lib/config";
import { createItem, listItems, updateItem } from "@/lib/directus";
import type {
  AppNotification,
  Appointment,
  Customer,
  Reminder,
  Service,
  Shop,
} from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type NewNotification = {
  customer?: number | null;
  shop?: number | null;
  appointment?: number | null;
  channel: "email" | "sms" | "system";
  recipient: string;
  subject?: string | null;
  body: string;
};

async function sendSms(recipient: string, body: string) {
  const provider = appConfig.smsProvider;

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) throw new Error("Twilio is not configured.");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: recipient, From: from, Body: body }),
      }
    );
    if (!response.ok) throw new Error(`Twilio rejected the message (${response.status}).`);
    return "twilio";
  }

  if (provider === "semaphore") {
    const apiKey = process.env.SEMAPHORE_API_KEY;
    if (!apiKey) throw new Error("Semaphore is not configured.");
    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        apikey: apiKey,
        number: recipient,
        message: body,
        sendername: process.env.SEMAPHORE_SENDER_NAME ?? appConfig.name,
      }),
    });
    if (!response.ok) throw new Error(`Semaphore rejected the message (${response.status}).`);
    return "semaphore";
  }

  return "mock";
}

async function sendEmail(recipient: string, subject: string, body: string) {
  const provider = appConfig.emailProvider;
  if (provider === "mock" || !provider) {
    return "mock";
  }
  return provider;
}

export async function createNotification(input: NewNotification) {
  return createItem<AppNotification>("notifications", {
    customer: input.customer ?? null,
    shop: input.shop ?? null,
    appointment: input.appointment ?? null,
    channel: input.channel,
    recipient: input.recipient,
    subject: input.subject ?? null,
    body: input.body,
    status: "pending",
    provider: null,
    sent_at: null,
  });
}

export async function dispatchNotification(notification: AppNotification) {
  try {
    let provider = "mock";

    if (notification.channel === "sms") {
      provider = await sendSms(notification.recipient, notification.body);
    } else if (notification.channel === "email") {
      provider = await sendEmail(
        notification.recipient,
        notification.subject ?? appConfig.name,
        notification.body
      );
    }

    await updateItem("notifications", notification.id, {
      status: "sent",
      provider,
      sent_at: new Date().toISOString(),
    });
    return { ok: true as const, provider };
  } catch (error) {
    await updateItem("notifications", notification.id, {
      status: "failed",
      provider: appConfig.smsProvider,
    });
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Notification failed.",
    };
  }
}

export async function notifyBookingCreated(options: {
  appointment: Appointment;
  customer: Customer;
  shop: Shop;
  service: Service;
  petName: string;
}) {
  const { appointment, customer, shop, service, petName } = options;
  const when = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: appConfig.timezone,
  }).format(new Date(appointment.start_at));

  const body = `Hi ${customer.first_name}! Your ${service.name} request for ${petName} at ${shop.name} is waiting for the shop to confirm. Requested time: ${when}. Booking code: ${appointment.qr_code}. Total: ${formatMoney(service.price)}. We will notify you as soon as the shop responds.`;

  const records = [
    await createNotification({
      customer: customer.id,
      shop: shop.id,
      appointment: appointment.id,
      channel: "system",
      recipient: customer.phone ?? "",
      subject: "Booking request received",
      body,
    }),
  ];

  if (customer.phone) {
    records.push(
      await createNotification({
        customer: customer.id,
        shop: shop.id,
        appointment: appointment.id,
        channel: "sms",
        recipient: customer.phone,
        body,
      })
    );
  }

  await Promise.all(records.map((record) => dispatchNotification(record)));
}

export async function scheduleAppointmentReminder(options: {
  appointment: Appointment;
  customer: Customer;
  shop: Shop;
  serviceName: string;
  petName: string;
}) {
  const { appointment, customer, shop, serviceName, petName } = options;
  const existing = await listItems<Reminder>(
    "reminders",
    `filter[appointment][_eq]=${appointment.id}&filter[type][_eq]=upcoming&filter[status][_eq]=scheduled&limit=1`
  );
  if (existing.length) return;

  const when = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: appConfig.timezone,
  }).format(new Date(appointment.start_at));

  await createItem<Reminder>("reminders", {
    appointment: appointment.id,
    type: "upcoming",
    send_at: new Date(new Date(appointment.start_at).getTime() - 24 * 60 * 60_000).toISOString(),
    status: "scheduled",
    channel: customer.phone ? "sms" : "email",
    message: `Reminder: ${serviceName} for ${petName} at ${shop.name} on ${when}.`,
  });
}

export async function notifyCustomer(options: {
  customer: Customer;
  shop: Shop;
  appointment: Appointment | null;
  subject: string;
  body: string;
}) {
  const { customer, shop, appointment, subject, body } = options;
  const record = await createNotification({
    customer: customer.id,
    shop: shop.id,
    appointment: appointment?.id ?? null,
    channel: "system",
    recipient: customer.phone ?? "",
    subject,
    body,
  });
  await dispatchNotification(record);

  if (customer.phone) {
    const sms = await createNotification({
      customer: customer.id,
      shop: shop.id,
      appointment: appointment?.id ?? null,
      channel: "sms",
      recipient: customer.phone,
      body,
    });
    await dispatchNotification(sms);
  }
}

export async function pendingNotifications(limit = 50) {
  return listItems<AppNotification>(
    "notifications",
    `filter[status][_eq]=pending&limit=${limit}&sort=date_created`
  );
}
