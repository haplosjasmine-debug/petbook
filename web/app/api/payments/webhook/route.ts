
import { NextResponse } from "next/server";
import { listItems, updateItem } from "@/lib/directus";
import {
  markCommissionPaid,
  markTransactionPaid,
} from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/paymongo";
import type { CommissionPayment, Transaction } from "@/lib/types";

type PayMongoEvent = {
  data?: {
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          reference_number?: string;
          payments?: Array<{
            attributes?: {
              source?: { type?: string };
            };
          }>;
        };
      };
    };
  };
};

type XenditEvent = {
  event?: string;
  data?: {
    payment_id?: string;
    payment_request_id?: string;
    reference_id?: string;
    channel_code?: string;
    status?: string;
  };
};

async function findTransaction(reference?: string) {
  if (!reference) return null;

  const rows = await listItems<Transaction>(
    "transactions",
    `filter[reference][_eq]=${encodeURIComponent(reference)}&limit=1`
  );

  return rows[0] ?? null;
}

async function findCommissionPayment(
  checkoutId?: string,
  reference?: string
) {
  if (checkoutId) {
    const rows = await listItems<CommissionPayment>(
      "commission_payments",
      `filter[checkout_id][_eq]=${encodeURIComponent(checkoutId)}&limit=1`
    );

    if (rows[0]) return rows[0];
  }

  if (reference) {
    const rows = await listItems<CommissionPayment>(
      "commission_payments",
      `filter[reference][_eq]=${encodeURIComponent(reference)}&limit=1`
    );

    if (rows[0]) return rows[0];
  }

  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const xenditToken = request.headers.get("x-callback-token");
  const expectedXenditToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (xenditToken) {
    if (
      !expectedXenditToken ||
      xenditToken !== expectedXenditToken
    ) {
      return NextResponse.json(
        { message: "Invalid Xendit callback token." },
        { status: 401 }
      );
    }

    let event: XenditEvent;

    try {
      event = JSON.parse(rawBody) as XenditEvent;
    } catch {
      return NextResponse.json(
        { message: "Invalid payload." },
        { status: 400 }
      );
    }

    const eventType = event.event ?? "";
    const paymentRequestId = event.data?.payment_request_id;
    const paymentId = event.data?.payment_id;

    if (!paymentRequestId && !paymentId) {
      return NextResponse.json({ received: true });
    }

    const transaction =
      (await findTransaction(paymentRequestId)) ??
      (await findTransaction(paymentId));

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    if (
      eventType === "payment.capture" &&
      event.data?.status === "SUCCEEDED"
    ) {
      if (transaction.status !== "paid") {
        await markTransactionPaid({
          transactionId: transaction.id,
          provider: "xendit",
          method: "gcash",
          reference: paymentId ?? paymentRequestId ?? null,
        });
      }
    }

    if (
      eventType === "payment.failure" &&
      transaction.status !== "paid"
    ) {
      await updateItem("transactions", transaction.id, {
        status: "failed",
      });
    }

    return NextResponse.json({ received: true });
  }

  const signature = request.headers.get("paymongo-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { message: "Invalid signature." },
      { status: 401 }
    );
  }

  let event: PayMongoEvent;

  try {
    event = JSON.parse(rawBody) as PayMongoEvent;
  } catch {
    return NextResponse.json(
      { message: "Invalid payload." },
      { status: 400 }
    );
  }

  const type = event.data?.attributes?.type ?? "";
  const checkout = event.data?.attributes?.data;
  const checkoutId = checkout?.id;
  const reference = checkout?.attributes?.reference_number;

  if (!checkoutId && !reference) {
    return NextResponse.json({ received: true });
  }

  const method =
    checkout?.attributes?.payments?.[0]?.attributes?.source?.type ??
    "online";

  const transaction = await findTransaction(
    checkoutId ?? reference
  );

  const commissionPayment = transaction
    ? null
    : await findCommissionPayment(checkoutId, reference);

  if (type.includes("checkout_session.payment.paid")) {
    if (transaction && transaction.status !== "paid") {
      await markTransactionPaid({
        transactionId: transaction.id,
        provider: "paymongo",
        method,
        reference: checkoutId ?? reference ?? null,
      });
    }

    if (commissionPayment) {
      await markCommissionPaid({
        paymentId: commissionPayment.id,
        provider: "paymongo",
        method,
        reference: checkoutId ?? reference ?? null,
      });
    }
  }

  if (type.includes("checkout_session.payment.failed")) {
    if (transaction && transaction.status !== "paid") {
      await updateItem("transactions", transaction.id, {
        status: "pending",
      });
    }

    if (commissionPayment) {
      await updateItem("commission_payments", commissionPayment.id, {
        status: "failed",
      });
    }
  }

  return NextResponse.json({ received: true });
}
