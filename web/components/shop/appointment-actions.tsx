"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AppointmentStatus } from "@/lib/types";

type Action = { label: string; status: AppointmentStatus; variant?: "default" | "outline" | "ghost" | "destructive" };

export function ShopAppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const actions: Action[] =
    status === "pending"
      ? [
          { label: "Confirm", status: "confirmed" },
          { label: "Cancel", status: "cancelled", variant: "ghost" },
        ]
      : status === "confirmed"
        ? [
            { label: "Check in", status: "checked_in" },
            { label: "No show", status: "no_show", variant: "outline" },
            { label: "Cancel", status: "cancelled", variant: "ghost" },
          ]
        : status === "checked_in"
          ? [
              { label: "Start", status: "in_progress" },
              { label: "No show", status: "no_show", variant: "ghost" },
            ]
          : status === "in_progress"
            ? [{ label: "Complete", status: "completed" }]
            : [];

  async function update(next: AppointmentStatus) {
    if (
      (next === "cancelled" || next === "no_show") &&
      !window.confirm(`Mark this appointment as ${next.replace("_", " ")}?`)
    ) {
      return;
    }

    setLoading(next);
    const response = await fetch(`/api/shop/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(null);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to update the appointment.");
      return;
    }

    toast.success(
      next === "completed"
        ? "Visit completed. Commission and loyalty points recorded."
        : `Appointment marked ${next.replace("_", " ")}.`
    );
    router.refresh();
  }

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant={action.variant ?? "default"}
          onClick={() => update(action.status)}
          disabled={loading !== null}
          className={action.variant === "ghost" ? "text-destructive hover:bg-red-50" : undefined}
        >
          {loading === action.status ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
