"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardList,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BusinessApplication, Shop } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ApprovalResult = {
  application: BusinessApplication;
  shop?: Shop;
  credentials?: { email: string; temporaryPassword: string };
};

export function AdminBusinessApplications({
  applications,
}: {
  applications: BusinessApplication[];
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const router = useRouter();

  async function review(application: BusinessApplication, action: "approve" | "reject") {
    const decision_note =
      action === "reject"
        ? window.prompt("Optional note for the applicant:", "Application did not meet requirements.")
        : "";
    if (action === "reject" && decision_note === null) return;

    setBusy(application.id);
    const response = await fetch(`/api/admin/business-applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, decision_note }),
    });
    const data = (await response.json().catch(() => ({}))) as ApprovalResult & {
      message?: string;
    };
    setBusy(null);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to review the application.");
      return;
    }

    setResult(data);
    toast.success(action === "approve" ? "Business approved." : "Application rejected.");
    router.refresh();
  }

  if (!applications.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No business applications"
        description="New business owner applications will appear here for super admin review."
      />
    );
  }

  return (
    <div className="space-y-4">
      {result?.credentials ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-black">Business owner account created</h3>
                <p className="mt-1 text-sm text-emerald-900/70">
                  Share these one-time credentials with the applicant. The password is not stored
                  anywhere in PetBook.
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/60">
                      Email
                    </p>
                    <p className="font-mono font-semibold">{result.credentials.email}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/60">
                      Temporary password
                    </p>
                    <p className="font-mono font-semibold">{result.credentials.temporaryPassword}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {applications.map((application) => (
        <Card key={application.id}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{application.business_name}</h3>
                  <StatusBadge status={application.status} />
                </div>
                <p className="mt-1 text-sm font-semibold">{application.contact_name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {application.email}
                  </span>
                  {application.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {application.phone}
                    </span>
                  ) : null}
                  {application.city ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {application.city}
                    </span>
                  ) : null}
                  <span>Applied {formatDate(application.date_created, false)}</span>
                </div>
                {application.message ? (
                  <p className="mt-3 max-w-2xl rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
                    {application.message}
                  </p>
                ) : null}
                {application.decision_note ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Review note: {application.decision_note}
                  </p>
                ) : null}
              </div>

              {application.status === "pending" ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => review(application, "approve")}
                    disabled={busy === application.id}
                  >
                    {busy === application.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => review(application, "reject")}
                    disabled={busy === application.id}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
