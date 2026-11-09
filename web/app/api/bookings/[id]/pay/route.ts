import { NextResponse } from "next/server";
import { customerSession, unauthorized } from "@/lib/authz";
import { appConfig } from "@/lib/config";
import { DirectusError, getItem, updateItem } from "@/lib/directus";
import { PayMongoError, createCheckoutSession } from "@/lib/paymongo";
import { appointmentTransaction, markTransactionPaid } from "@/lib/payments";
import type { Appointment, Pet, Service, Shop, Transaction } from "@/lib/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await customerSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const appointmentId = Number(id);

  try {
    const payload = (await request.json().catch(() => ({}))) as { method?: string };
    const method = payload.method === "paymongo" ? "paymongo" : "mock";

    const result = await getItem<{ data: Appointment }>("appointments", appointmentId, "?fields=*");
    const appointment = result.data;

    if (!appointment || Number(appointment.customer) !== session.customer.id) {
      return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
    }

    let transaction = await appointmentTransaction(appointment.id);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
    }

    if (transaction.status === "paid") {
      return NextResponse.json({ message: "This appointment is already paid.", paid: true });
    }

    if (method === "mock") {
      transaction = await markTransactionPaid({
        transactionId: transaction.id,
        provider: "mock",
        method: "mock",
        reference: transaction.reference ?? `MOCK-${appointment.qr_code}`,
      });
      return NextResponse.json({ paid: true, transaction });
    }

    const [shopResult, serviceResult, petResult] = await Promise.all([
      getItem<{ data: Shop }>("shops", Number(appointment.shop), "?fields=*"),
      getItem<{ data: Service }>("services", Number(appointment.service), "?fields=*"),
      getItem<{ data: Pet }>("pets", Number(appointment.pet), "?fields=*"),
    ]);

    const checkout = await createCheckoutSession({
      amount: Number(appointment.price),
      description: `${serviceResult.data.name} for ${petResult.data.name} at ${shopResult.data.name}`,
      reference: appointment.qr_code,
      customerEmail: session.user.email,
      successUrl: `${appConfig.appUrl}/payments/success?appointment=${appointment.id}`,
      cancelUrl: `${appConfig.appUrl}/appointments/${appointment.id}`,
      metadata: {
        appointment_id: String(appointment.id),
        transaction_id: String(transaction.id),
      },
    });

    await updateItem<Transaction>("transactions", transaction.id, {
      provider: "paymongo",
      reference: checkout.id,
    });

    return NextResponse.json({ checkout_url: checkout.checkout_url });
  } catch (error) {
    if (error instanceof PayMongoError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof DirectusError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to start payment." }, { status: 500 });
  }
}
