import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { customerSession, unauthorized } from "@/lib/authz";
import { addMinutes, makeQrCode, overlaps } from "@/lib/booking";
import { appConfig } from "@/lib/config";
import {
  createItem,
  DirectusError,
  getItem,
  listItems,
  updateItem,
} from "@/lib/directus";
import { notifyBookingCreated } from "@/lib/notifications";
import { createCheckoutSession } from "@/lib/paymongo";
import { ensurePendingTransaction, markTransactionPaid } from "@/lib/payments";
import type {
  Appointment,
  Pet,
  Service,
  Shop,
  Staff,
  Transaction,
} from "@/lib/types";
import { bookingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await customerSession();
  if (!session) return unauthorized();

  try {
    const input = bookingSchema.parse(await request.json());
    const customer = session.customer;

    const [serviceResult, petResult] = await Promise.all([
      getItem<{ data: Service }>("services", input.service_id, "?fields=*"),
      getItem<{ data: Pet }>("pets", input.pet_id, "?fields=*"),
    ]);

    const service = serviceResult.data;
    const pet = petResult.data;

    if (!service || Number(service.shop) !== input.shop_id || !service.active) {
      return NextResponse.json({ message: "That service is not available." }, { status: 400 });
    }

    if (!pet || Number(pet.customer) !== customer.id) {
      return NextResponse.json({ message: "Choose one of your own pets." }, { status: 400 });
    }

    const shopResult = await getItem<{ data: Shop }>("shops", input.shop_id, "?fields=*");
    const shop = shopResult.data;
    if (!shop || !shop.active) {
      return NextResponse.json({ message: "That shop is not accepting bookings." }, { status: 400 });
    }

    let staff: Staff | null = null;
    if (input.staff_id) {
      const staffResult = await getItem<{ data: Staff }>("staff", input.staff_id, "?fields=*");
      staff = staffResult.data ?? null;
      if (!staff || Number(staff.shop) !== shop.id || !staff.active) {
        return NextResponse.json({ message: "Choose an available staff member." }, { status: 400 });
      }
    }

    const startAt = new Date(input.start_at);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      return NextResponse.json({ message: "Choose a future appointment time." }, { status: 400 });
    }

    const endAt = addMinutes(startAt, Number(service.duration_min));

    if (staff) {
      const existing = await listItems<Appointment>(
        "appointments",
        `filter[shop][_eq]=${shop.id}&filter[staff][_eq]=${staff.id}&filter[status][_nin]=cancelled,no_show&filter[start_at][_lte]=${encodeURIComponent(
          endAt.toISOString()
        )}&filter[end_at][_gte]=${encodeURIComponent(startAt.toISOString())}&limit=20`
      );

      const conflict = existing.some((appointment) =>
        overlaps(
          startAt,
          endAt,
          new Date(appointment.start_at),
          new Date(appointment.end_at)
        )
      );

      if (conflict) {
        return NextResponse.json(
          { message: "That staff member is already booked. Pick another time." },
          { status: 409 }
        );
      }
    }

    const appointment = await createItem<Appointment>("appointments", {
      shop: shop.id,
      customer: customer.id,
      pet: pet.id,
      service: service.id,
      package: null,
      staff: staff?.id ?? null,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "pending",
      price: service.price,
      notes: input.notes || null,
      qr_code: makeQrCode(),
      checked_in_at: null,
      completed_at: null,
    });

    let transaction = await ensurePendingTransaction(appointment);
    let checkoutUrl: string | null = null;

    const paymentMethod = input.payment_method ?? "mock";

    if (paymentMethod === "mock") {
      transaction = await markTransactionPaid({
        transactionId: transaction.id,
        provider: "mock",
        method: "mock",
        reference: `MOCK-${appointment.qr_code}`,
      });
    }

    if (paymentMethod === "paymongo") {
      const checkout = await createCheckoutSession({
        amount: Number(service.price),
        description: `${service.name} for ${pet.name} at ${shop.name}`,
        reference: appointment.qr_code,
        customerEmail: session.user.email,
        successUrl: `${appConfig.appUrl}/payments/success?appointment=${appointment.id}`,
        cancelUrl: `${appConfig.appUrl}/appointments/${appointment.id}`,
        metadata: {
          appointment_id: String(appointment.id),
          transaction_id: String(transaction.id),
        },
      });
      checkoutUrl = checkout.checkout_url;
      await updateItem<Transaction>("transactions", transaction.id, {
        provider: "paymongo",
        reference: checkout.id,
      });
    }

    await notifyBookingCreated({
      appointment,
      customer,
      shop,
      service,
      petName: pet.name,
    }).catch(() => null);

    return NextResponse.json(
      {
        appointment,
        transaction,
        checkout_url: checkoutUrl,
        message: "Booking created.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? "Check the booking details." },
        { status: 422 }
      );
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to book." },
      { status: 500 }
    );
  }
}
