"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CommissionPayButton({
  amount,
  allowMock,
}: {
  amount: number;
  allowMock: boolean;
}) {
  const [loading, setLoading] = useState<"paymongo" | "mock" | null>(null);
  const router = useRouter();

  async function pay(method: "paymongo" | "mock") {
    setLoading(method);
    const response = await fetch("/api/shop/commissions/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      checkout_url?: string;
      paid?: boolean;
    };
    setLoading(null);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to start the commission payment.");
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    toast.success("Commission paid and transactions marked as settled.");
    router.refresh();
  }

  if (amount < 1) {
    return <p className="text-sm text-muted-foreground">All commissions are settled.</p>;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => pay("paymongo")}
        disabled={loading !== null}
      >
        {loading === "paymongo" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Pay commission online
      </Button>
      {allowMock ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => pay("mock")}
          disabled={loading !== null}
        >
          {loading === "mock" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Simulate payment (demo)
        </Button>
      ) : null}
    </div>
  );
}
