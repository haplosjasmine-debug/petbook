import { NextResponse } from "next/server";
import { shopSession, unauthorized } from "@/lib/authz";
import { appConfig } from "@/lib/config";
import { roundMoney } from "@/lib/commission";
import { createItem, updateItem } from "@/lib/directus";
import { createCheckoutSession, PayMongoError } from "@/lib/paymongo";
import {
  markCommissionPaid,
  pendingCommissionTotal,
  pendingCommissionTransactions,
} from "@/lib/payments";
import type { CommissionPayment } from "@/lib/types";

export async function POST(request: Request) {
  const session = await shopSession();
  if (!session) return unauthorized();

  try {
    const payload = (await request.json().catch(() => ({}))) as { method?: string };
    const method = payload.method === "mock" ? "mock" : "paymongo";
    const shop = session.shop;

    if (method === "mock" && appConfig.paymentProvider === "paymongo") {
      return NextResponse.json(
        { message: "Demo payments are disabled while PayMongo is configured." },
        { status: 403 }
      );
    }

    const pending = await pendingCommissionTransactions(shop.id);
    const amount = roundMoney(pendingCommissionTotal(pending));

    if (amount < 1) {
      return NextResponse.json(
        { message: "There is no pending commission to pay right now." },
        { status: 422 }
      );
    }

    const reference = `COMMISSION-${shop.id}-${Date.now()}`;

    if (method === "mock") {
      const payment = await createItem<CommissionPayment>("commission_payments", {
        shop: shop.id,
        amount,
        status: "paid",
        provider: "mock",
        method: "mock",
        reference: `MOCK-${reference}`,
        checkout_id: null,
        paid_at: new Date().toISOString(),
      });
      const result = await markCommissionPaid({
        paymentId: payment.id,
        provider: "mock",
        method: "mock",
        reference: payment.reference,
      });
      return NextResponse.json({ paid: true, payment: result.payment, settled: result.settled });
    }

    const payment = await createItem<CommissionPayment>("commission_payments", {
      shop: shop.id,
      amount,
      status: "pending",
      provider: "paymongo",
      method: null,
      reference,
      checkout_id: null,
      paid_at: null,
    });

    const checkout = await createCheckoutSession({
      amount,
      description: `PetBook commission for ${shop.name}`,
      reference,
      customerEmail: session.user.email,
      successUrl: `${appConfig.appUrl}/shop/commissions/success?payment=${payment.id}`,
      cancelUrl: `${appConfig.appUrl}/shop/commissions`,
      metadata: {
        kind: "commission",
        commission_payment_id: String(payment.id),
        shop_id: String(shop.id),
      },
    });

    await updateItem<CommissionPayment>("commission_payments", payment.id, {
      checkout_id: checkout.id,
    });

    return NextResponse.json({ checkout_url: checkout.checkout_url, payment_id: payment.id });
  } catch (error) {
    if (error instanceof PayMongoError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to start commission payment." },
      { status: 500 }
    );
  }
}
