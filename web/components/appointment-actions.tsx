"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AppointmentActions({
  appointmentId,
  status,
  transactionStatus,
}: {
  appointmentId: number;
  status: string;
  transactionStatus?: string | null;
}) {
  const [loading, setLoading] = useState<"cancel" | "pay" | "online" | null>(null);
  const router = useRouter();

  const cancellable = ["pending", "confirmed", "checked_in"].includes(status);
  const payable = transactionStatus !== "paid" && !["cancelled", "completed"].includes(status);

  async function cancel() {
    if (!window.confirm("Cancel this appointment? This cannot be undone.")) return;
    setLoading("cancel");
    const response = await fetch(`/api/appointments/${appointmentId}/cancel`, { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(null);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to cancel.");
      return;
    }
    toast.success("Appointment cancelled.");
    router.refresh();
  }

  async function pay(method: "mock" | "paymongo") {
    setLoading(method === "mock" ? "pay" : "online");
    const response = await fetch(`/api/bookings/${appointmentId}/pay`, {
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
      toast.error(data.message ?? "Unable to start payment.");
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    toast.success("Payment recorded.");
    router.refresh();
  }

  if (!cancellable && !payable) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {payable ? (
        <>
          <Button type="button" size="sm" onClick={() => pay("mock")} disabled={loading !== null}>
            {loading === "pay" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Pay at shop
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => pay("paymongo")}
            disabled={loading !== null}
          >
            {loading === "online" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Pay online
          </Button>
        </>
      ) : null}

      {cancellable ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={cancel}
          disabled={loading !== null}
          className="text-destructive hover:bg-red-50"
        >
          {loading === "cancel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
