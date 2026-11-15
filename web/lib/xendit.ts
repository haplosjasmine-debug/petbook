
const XENDIT_API_URL = "https://api.xendit.co/v3/payment_requests";

export class XenditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XenditError";
  }
}

export async function createXenditPayment({
  amount,
  referenceId,
  description,
  successUrl,
  failureUrl,
}: {
  amount: number;
  referenceId: string;
  description: string;
  successUrl: string;
  failureUrl: string;
}) {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    throw new XenditError("Xendit secret key is not configured.");
  }

  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    throw new XenditError("Invalid GCash payment amount.");
  }

  const response = await fetch(XENDIT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      "api-version": "2024-11-11",
    },
    body: JSON.stringify({
      reference_id: referenceId,
      type: "PAY",
      country: "PH",
      currency: "PHP",
      request_amount: amount,
      capture_method: "AUTOMATIC",
      channel_code: "GCASH",
      channel_properties: {
        success_return_url: successUrl,
        failure_return_url: failureUrl,
      },
      description,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new XenditError(
      result.message || "Unable to create Xendit payment."
    );
  }

  const checkoutUrl = result.actions?.find(
    (action: { type: string; value: string }) =>
      action.type === "REDIRECT_CUSTOMER"
  )?.value;

  if (!checkoutUrl) {
    throw new XenditError("Xendit did not return a checkout URL.");
  }

  return {
    paymentRequestId: result.payment_request_id,
    checkoutUrl,
    status: result.status,
  };
}


export async function simulateXenditPayment(paymentRequestId: string) {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    throw new XenditError("Xendit secret key is not configured.");
  }

  if (!paymentRequestId.startsWith("pr-")) {
    throw new XenditError("Invalid payment request ID.");
  }

  if (!secretKey.startsWith("xnd_development_")) {
    throw new XenditError("Payment simulation is only allowed in Test Mode.");
  }

  const response = await fetch(
    `${XENDIT_API_URL}/${encodeURIComponent(paymentRequestId)}/simulate`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "api-version": "2024-11-11",
      },
      body: JSON.stringify({}),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new XenditError(
      result.message || "Unable to simulate Xendit payment."
    );
  }

  return result;
}
