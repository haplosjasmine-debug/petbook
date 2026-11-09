"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoyaltyRedeemForm({
  balance,
  minimum,
}: {
  balance: number;
  minimum: number;
}) {
  const [points, setPoints] = useState(String(minimum));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: Number(points) }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to redeem points.");
      return;
    }

    toast.success(data.message ?? "Points redeemed.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="redeem-points">Points to redeem</Label>
        <Input
          id="redeem-points"
          type="number"
          min={minimum}
          max={balance}
          step={1}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Minimum {minimum} points · available {balance} points
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading || balance < minimum}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
        {loading ? "Redeeming…" : "Redeem points"}
      </Button>
      {balance < minimum ? (
        <p className="text-center text-xs text-muted-foreground">
          Earn {minimum - balance} more points to unlock your first reward.
        </p>
      ) : null}
    </form>
  );
}
