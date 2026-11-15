
import { NextResponse } from "next/server";
import { customerSession, unauthorized } from "@/lib/authz";
import { getItem } from "@/lib/directus";
import { appointmentTransaction } from "@/lib/payments";
import { simulateXenditPayment, XenditError } from "@/lib/xendit";
import type { Appointment } from "@/lib/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await customerSession();

  if (!session) return unauthorized();

  if (!process.env.XENDIT_SECRET_KEY?.startsWith("xnd_development_")) {
    return NextResponse.json(
      { message: "Payment simulation is only available in Test Mode." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const appointmentId = Number(id);

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return NextResponse.json(
      { message: "Invalid appointment ID." },
      { status: 400 }
    );
  }

  try {
    const result = await getItem<{ data: Appointment }>(
      "appointments",
      appointmentId,
      "?fields=*"
    );

    const appointment = result.data;

    if (
      !appointment ||
      Number(appointment.customer) !== session.customer.id
    ) {
      return NextResponse.json(
        { message: "Appointment not found." },
        { status: 404 }
      );
    }

    const transaction = await appointmentTransaction(appointmentId);

    if (!transaction || transaction.provider !== "xendit") {
      return NextResponse.json(
        { message: "Xendit transaction not found." },
        { status: 404 }
      );
    }

    if (transaction.status === "paid") {
      return NextResponse.json(
        { message: "This payment is already paid." },
        { status: 409 }
      );
    }

    const paymentRequestId = transaction.reference;

    if (!paymentRequestId?.startsWith("pr-")) {
      return NextResponse.json(
        { message: "Invalid Xendit payment request reference." },
        { status: 400 }
      );
    }

    const simulation = await simulateXenditPayment(paymentRequestId);

    return NextResponse.json({
      message: "Xendit simulation requested.",
      simulation,
    });
  } catch (error) {
    if (error instanceof XenditError) {
      return NextResponse.json(
        { message: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Unable to simulate payment." },
      { status: 500 }
    );
  }
}
