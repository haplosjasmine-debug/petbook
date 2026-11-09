import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getItem } from "@/lib/directus";
import { appointmentTransaction } from "@/lib/payments";
import { requireCustomer } from "@/lib/session";
import type { Appointment, Transaction } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Payment status" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const session = await requireCustomer();
  const params = await searchParams;
  const appointmentId = Number(params.appointment);

  if (!Number.isFinite(appointmentId)) redirect("/dashboard/appointments");

  const appointment = await getItem<{ data: Appointment }>(
    "appointments",
    appointmentId,
    "?fields=*"
  )
    .then((result) => result.data)
    .catch(() => null);

  if (!appointment || Number(appointment.customer) !== session.customer?.id) {
    redirect("/dashboard/appointments");
  }

  const transaction = await appointmentTransaction(appointment.id).catch(() => null);
  const paid = transaction?.status === "paid";

  return (
    <section className="page-shell max-w-xl py-16">
      <Card>
        <CardContent className="p-8 text-center">
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {paid ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
          </span>
          <h1 className="mt-5 text-2xl font-black">
            {paid ? "Payment received" : "Payment is processing"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {paid
              ? "Your booking is confirmed. A receipt and reminder details are available in your appointments."
              : "We have not received the final PayMongo confirmation yet. Refresh this page in a moment or check your appointment for the latest status."}
          </p>

          <div className="mt-6 space-y-3 rounded-2xl bg-secondary/70 p-4 text-left text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Appointment</span>
              <span className="font-semibold">#{appointment.id}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">When</span>
              <span className="font-semibold">{formatDate(appointment.start_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatMoney(appointment.price)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={appointment.status} />
            </div>
            {transaction ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment</span>
                <StatusBadge status={transaction.status} />
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/dashboard/appointments/${appointment.id}`}>
                <ReceiptText className="h-4 w-4" /> View appointment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/appointments">All appointments</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
