import { Coins, Gift, Sparkles, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoyaltyRedeemForm } from "@/components/loyalty-redeem-form";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appConfig } from "@/lib/config";
import { minimumRedemption, pointsValue } from "@/lib/loyalty";
import { customerLoyalty } from "@/lib/queries";
import { requireCustomer } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Loyalty" };

export default async function LoyaltyPage() {
  const session = await requireCustomer();
  const customer = session.customer!;
  const entries = await customerLoyalty(customer.id).catch(() => []);

  const balance = Number(customer.loyalty_points ?? 0);
  const earned = entries
    .filter((entry) => entry.type === "earned")
    .reduce((total, entry) => total + Number(entry.points), 0);
  const redeemed = Math.abs(
    entries
      .filter((entry) => entry.type === "redeemed")
      .reduce((total, entry) => total + Number(entry.points), 0)
  );

  return (
    <>
      <PageHeader
        eyebrow="Rewards"
        title="Loyalty points"
        description="Earn points every time you complete a visit, then turn them into savings."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Available points"
          value={balance}
          hint={`Worth ${formatMoney(pointsValue(balance))}`}
          icon={Coins}
          tone="amber"
        />
        <StatCard label="Points earned" value={earned} icon={TrendingUp} />
        <StatCard label="Points redeemed" value={redeemed} icon={Gift} tone="coral" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points activity</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {entry.description || (entry.type === "earned" ? "Points earned" : "Points redeemed")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.date_created)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-black ${
                          Number(entry.points) >= 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {Number(entry.points) > 0 ? "+" : ""}
                        {entry.points}
                      </p>
                      <StatusBadge status={entry.type} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No points yet"
                description="Complete your first appointment to start earning loyalty points."
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-4 w-4 text-brand-600" /> Redeem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoyaltyRedeemForm balance={balance} minimum={minimumRedemption()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Earn {appConfig.loyaltyPointsPerHundred} points for every ₱100 spent on completed
                appointments.
              </p>
              <p>
                Each point is worth {formatMoney(appConfig.loyaltyPointValue)}. The minimum
                redemption is {minimumRedemption()} points.
              </p>
              <p>Points are added automatically when your visit is marked completed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
