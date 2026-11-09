"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppointmentStatus } from "@/lib/types";

type Action = {
  label: string;
  status: AppointmentStatus;
  variant?: "default" | "outline" | "ghost" | "destructive";
};

export function ShopAppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const router = useRouter();

  const actions: Action[] =
    status === "pending"
      ? [
          { label: "Confirm", status: "confirmed" },
          { label: "Reject", status: "rejected", variant: "outline" },
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

  async function update(next: AppointmentStatus, rejectionReason = "") {
    if (
      (next === "cancelled" || next === "no_show") &&
      !window.confirm(`Mark this appointment as ${next.replace("_", " ")}?`)
    ) {
      return false;
    }

    setLoading(next);
    const response = await fetch(`/api/shop/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, reason: rejectionReason }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(null);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to update the appointment.");
      return false;
    }

    toast.success(
      next === "completed"
        ? "Visit completed. Loyalty points recorded."
        : next === "rejected"
          ? "Booking declined. The customer can now see your reason."
          : next === "confirmed"
            ? "Booking confirmed. The customer has been notified."
            : `Appointment marked ${next.replace("_", " ")}.`
    );
    router.refresh();
    return true;
  }

  async function reject() {
    if (reason.trim().length < 5) {
      setReasonError("Add a short reason so the customer knows what to do next.");
      return;
    }
    setReasonError("");
    const ok = await update("rejected", reason.trim());
    if (ok) {
      setRejectOpen(false);
      setReason("");
    }
  }

  if (!actions.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            type="button"
            size="sm"
            variant={action.variant ?? "default"}
            onClick={() =>
              action.status === "rejected" ? setRejectOpen(true) : update(action.status)
            }
            disabled={loading !== null}
            className={
              action.status === "rejected"
                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                : action.variant === "ghost"
                  ? "text-destructive hover:bg-red-50"
                  : undefined
            }
          >
            {loading === action.status ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {action.status === "rejected" ? <XCircle className="h-4 w-4" /> : null}
            {action.label}
          </Button>
        ))}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this booking?</DialogTitle>
            <DialogDescription>
              The customer will receive your reason in their appointment and notification center.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`rejection-reason-${appointmentId}`}>Reason for declining</Label>
            <Textarea
              id={`rejection-reason-${appointmentId}`}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="Example: Our groomer is fully booked at this time. Please choose another slot."
              rows={4}
              maxLength={500}
            />
            {reasonError ? <p className="text-sm text-destructive">{reasonError}</p> : null}
            <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={reject}
              disabled={loading !== null}
            >
              {loading === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Decline booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
