import Link from "next/link";
import { CheckCircle2, Clock, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getItem } from "@/lib/directus";
import { requireShop } from "@/lib/session";
import type { CommissionPayment } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Commission payment status" };

export default async function CommissionPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await requireShop();
  const params = await searchParams;
  const paymentId = Number(params.payment);

  const payment = Number.isFinite(paymentId)
    ? await getItem<{ data: CommissionPayment }>("commission_payments", paymentId, "?fields=*")
        .then((result) => result.data)
        .catch(() => null)
    : null;

  const shopId = payment && typeof payment.shop === "object" ? payment.shop.id : payment?.shop;
  const accessible = payment && Number(shopId) === session.shop!.id;

  if (!accessible) {
    return (
      <section className="mx-auto max-w-xl py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700">
              <XCircle className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl font-black">Payment not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not find this commission payment for your shop.
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop/commissions">Back to commissions</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const paid = payment.status === "paid";

  return (
    <section className="mx-auto max-w-xl py-12">
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
            {paid ? "Commission paid" : "Payment is processing"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {paid
              ? "Your pending transactions have been marked as settled."
              : "PayMongo has not sent the final confirmation yet. Refresh in a moment to see the latest status."}
          </p>

          <div className="mt-6 space-y-3 rounded-2xl bg-secondary/70 p-4 text-left text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-lg font-black">{formatMoney(payment.amount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Created</span>
              <span className="font-semibold">{formatDate(payment.date_created)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={payment.status} />
            </div>
            {payment.reference ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="max-w-[13rem] truncate font-mono text-xs">
                  {payment.reference}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {!paid ? (
              <Button asChild>
                <Link href={`/shop/commissions/success?payment=${payment.id}`}>
                  <RotateCw className="h-4 w-4" /> Refresh status
                </Link>
              </Button>
            ) : null}
            <Button asChild variant={paid ? "default" : "outline"}>
              <Link href="/shop/commissions">Back to commissions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
