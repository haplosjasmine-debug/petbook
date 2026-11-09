import Link from "next/link";
import { ArrowRight, Coins, CreditCard, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { CommissionPayButton } from "@/components/shop/commission-pay-button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appConfig } from "@/lib/config";
import { commissionPaymentsForShop } from "@/lib/payments";
import { shopTransactions } from "@/lib/queries";
import { requireShop } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Commission payments" };

export default async function ShopCommissionsPage() {
  const session = await requireShop();
  const shop = session.shop!;

  const [transactions, payments] = await Promise.all([
    shopTransactions(shop.id, "", 500).catch(() => []),
    commissionPaymentsForShop(shop.id).catch(() => []),
  ]);

  const paidTransactions = transactions.filter((transaction) => transaction.status === "paid");
  const pending = paidTransactions.filter(
    (transaction) => transaction.commission_status === "pending"
  );
  const pendingAmount = pending.reduce(
    (total, transaction) => total + Number(transaction.commission_amount),
    0
  );
  const settledAmount = paidTransactions
    .filter((transaction) => transaction.commission_status === "settled")
    .reduce((total, transaction) => total + Number(transaction.commission_amount), 0);
  const onlinePaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Commission payments"
        description="Pay PetBook's platform commission online with GCash, Maya, card, or QR Ph."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/shop/reports">
              Revenue reports <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Commission due"
          value={formatMoney(pendingAmount)}
          hint={`${pending.length} unsettled bookings`}
          icon={Coins}
          tone="coral"
        />
        <StatCard
          label="Settled commission"
          value={formatMoney(settledAmount)}
          hint="Across completed bookings"
          icon={ShieldCheck}
        />
        <StatCard
          label="Paid online"
          value={formatMoney(onlinePaid)}
          hint={`${payments.filter((payment) => payment.status === "paid").length} payments`}
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Commission rate"
          value={`${Number(shop.commission_rate)}%`}
          hint="Applied to completed visits"
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-brand-200 bg-brand-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-brand-700" /> Pay your balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Amount due
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-brand-800">
                {formatMoney(pendingAmount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pending.length
                  ? `${pending.length} paid booking${pending.length === 1 ? "" : "s"} awaiting settlement`
                  : "Everything is settled. Nice work."}
              </p>
            </div>

            <CommissionPayButton
              amount={pendingAmount}
              allowMock={appConfig.paymentProvider === "mock"}
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your customer payments are separate. This checkout only collects PetBook's platform
              commission. Once PayMongo confirms payment, the matching transactions are marked as
              settled automatically.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-4 w-4 text-brand-600" /> Payment history
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(payment.date_created, false)}
                      </td>
                      <td className="font-semibold">{formatMoney(payment.amount)}</td>
                      <td className="capitalize">{payment.provider ?? "—"}</td>
                      <td className="max-w-[13rem] truncate font-mono text-[11px] text-muted-foreground">
                        {payment.reference ?? payment.checkout_id ?? "—"}
                      </td>
                      <td>
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No commission payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pending bookings</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/shop/reports">
              All transactions <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Appointment</th>
                <th>Gross</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.length ? (
                pending.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(transaction.date_created, false)}
                    </td>
                    <td>
                      #
                      {typeof transaction.appointment === "object"
                        ? transaction.appointment.id
                        : transaction.appointment}
                    </td>
                    <td>{formatMoney(transaction.amount)}</td>
                    <td className="font-semibold text-coral-600">
                      {formatMoney(transaction.commission_amount)}
                    </td>
                    <td>
                      <StatusBadge status={transaction.commission_status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No pending commission.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
