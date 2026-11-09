import { createHmac, timingSafeEqual } from "crypto";
import { appConfig } from "@/lib/config";
import { roundMoney } from "@/lib/commission";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

export class PayMongoError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "PayMongoError";
    this.status = status;
  }
}

type CheckoutInput = {
  amount: number;
  description: string;
  reference: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
};

export type CheckoutSession = {
  id: string;
  checkout_url: string;
};

function secretKey() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) {
    throw new PayMongoError(
      "PayMongo is not configured. Set PAYMONGO_SECRET_KEY to accept online payments.",
      422
    );
  }
  return key;
}

export function paymentMethods() {
  return (process.env.PAYMONGO_PAYMENT_METHODS ?? "gcash,maya,grab_pay,qrph,card")
    .split(",")
    .map((method) => method.trim())
    .filter(Boolean);
}

export async function createCheckoutSession(input: CheckoutInput) {
  const amount = Math.round(roundMoney(input.amount) * 100);
  if (amount < 100) {
    throw new PayMongoError("The minimum PayMongo checkout amount is PHP 1.00.", 422);
  }

  const response = await fetch(`${PAYMONGO_BASE}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: input.description,
          reference_number: input.reference,
          line_items: [
            {
              currency: appConfig.currency,
              amount,
              name: input.description,
              quantity: 1,
            },
          ],
          payment_method_types: paymentMethods(),
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: input.metadata ?? {},
          ...(input.customerEmail ? { billing: { email: input.customerEmail } } : {}),
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: { id: string; attributes?: { checkout_url?: string } };
    errors?: Array<{ detail?: string; message?: string }>;
  } | null;

  if (!response.ok || !payload?.data?.attributes?.checkout_url) {
    const message =
      payload?.errors?.map((error) => error.detail ?? error.message).filter(Boolean).join(", ") ??
      `PayMongo rejected the checkout (${response.status}).`;
    throw new PayMongoError(message, response.status);
  }

  return {
    id: payload.data.id,
    checkout_url: payload.data.attributes.checkout_url,
  } satisfies CheckoutSession;
}

export async function retrieveCheckoutSession(id: string) {
  const response = await fetch(`${PAYMONGO_BASE}/checkout_sessions/${id}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PayMongoError(`Unable to retrieve checkout session (${response.status}).`, response.status);
  }
  return payload as {
    data?: {
      id: string;
      attributes?: {
        payment_intent?: { id?: string; attributes?: { status?: string; payment_method_used?: string } };
        payments?: Array<{ id: string; attributes?: { status?: string; source?: { type?: string }; reference_number?: string } }>;
        status?: string;
        reference_number?: string;
      };
    };
  };
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  ) as Record<string, string | undefined>;

  const timestamp = parts.t;
  const testSignature = parts.te;
  const liveSignature = parts.li;
  const signature = testSignature || liveSignature;

  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
