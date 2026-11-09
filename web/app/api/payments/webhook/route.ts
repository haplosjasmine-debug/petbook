import { NextResponse } from "next/server";
import { listItems, updateItem } from "@/lib/directus";
import { markCommissionPaid, markTransactionPaid } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/paymongo";
import type { CommissionPayment, Transaction } from "@/lib/types";

type PayMongoEvent = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          reference_number?: string;
          payments?: Array<{
            id?: string;
            attributes?: { source?: { type?: string }; status?: string };
          }>;
        };
      };
    };
  };
};

async function findTransaction(checkoutId?: string, reference?: string) {
  if (checkoutId) {
    const rows = await listItems<Transaction>(
      "transactions",
      `filter[reference][_eq]=${encodeURIComponent(checkoutId)}&limit=1`
    );
    if (rows[0]) return rows[0];
  }
  if (reference) {
    const rows = await listItems<Transaction>(
      "transactions",
      `filter[reference][_eq]=${encodeURIComponent(reference)}&limit=1`
    );
    if (rows[0]) return rows[0];
  }
  return null;
}

async function findCommissionPayment(checkoutId?: string, reference?: string) {
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
  const signature = request.headers.get("paymongo-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  let event: PayMongoEvent;
  try {
    event = JSON.parse(rawBody) as PayMongoEvent;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const type = event.data?.attributes?.type ?? "";
  const checkout = event.data?.attributes?.data;
  const checkoutId = checkout?.id;
  const reference = checkout?.attributes?.reference_number;

  if (!checkoutId && !reference) {
    return NextResponse.json({ received: true });
  }

  const method = checkout?.attributes?.payments?.[0]?.attributes?.source?.type ?? "online";
  const transaction = await findTransaction(checkoutId, reference);
  const commissionPayment = transaction
    ? null
    : await findCommissionPayment(checkoutId, reference);

  if (type.includes("checkout_session.payment.paid")) {
    if (transaction) {
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
    if (transaction) {
      await updateItem("transactions", transaction.id, { status: "pending" });
    }
    if (commissionPayment) {
      await updateItem("commission_payments", commissionPayment.id, { status: "failed" });
    }
  }

  return NextResponse.json({ received: true });
}
