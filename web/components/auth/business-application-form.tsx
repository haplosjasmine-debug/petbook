"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MailCheck,
  RotateCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Step = "details" | "verify" | "submitted";

type StartResponse = {
  message?: string;
  email?: string;
  expiresAt?: number;
};

export function BusinessApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | undefined>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      business_name: form.get("business_name"),
      contact_name: form.get("contact_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      city: form.get("city"),
      address: form.get("address"),
      message: form.get("message"),
    };

    setLoading(true);
    const response = await fetch("/api/business-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as StartResponse;
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to send the verification code.");
      return;
    }

    setEmail(data.email ?? String(payload.email ?? ""));
    setExpiresAt(data.expiresAt);
    setCode("");
    setStep("verify");
    toast.success("Verification code sent. Check your business inbox.");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/business-applications/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to verify your email.");
      setCode("");
      return;
    }

    setStep("submitted");
    toast.success("Email verified. Application submitted.");
  }

  async function resendCode() {
    setResending(true);
    const response = await fetch("/api/business-applications/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => ({}))) as StartResponse;
    setResending(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to resend the code.");
      return;
    }

    setExpiresAt(data.expiresAt);
    setCode("");
    toast.success("A new verification code was sent.");
  }

  if (step === "submitted") {
    return (
      <div className="grid place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-black">Application received</h2>
        <p className="mt-2 max-w-md text-sm text-emerald-900/70">
          Your business email is verified. The PetBook super admin will review your business
          details. Once approved, your login credentials will be sent to {email}.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to PetBook</Link>
        </Button>
      </div>
    );
  }

  if (step === "verify") {
    const minutes = expiresAt
      ? Math.max(Math.ceil((expiresAt - Date.now()) / 60_000), 1)
      : 10;

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-brand-900">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
            <MailCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black">Verify your business email</p>
            <p className="mt-1 text-xs text-brand-800/70">
              We sent a 6-digit code to <span className="font-semibold">{email}</span>. The code
              expires in about {minutes} minute{minutes === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_verification_code">Verification code</Label>
            <Input
              id="business_verification_code"
              name="code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              className="text-center text-2xl font-black tracking-[0.35em]"
              required
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? "Verifying..." : "Verify and submit application"}
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={resendCode}
            disabled={resending}
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            {resending ? "Sending..." : "Resend code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => {
              setStep("details");
              setCode("");
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Edit application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business name</Label>
          <Input id="business_name" name="business_name" placeholder="Happy Paws Grooming" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_name">Owner or manager</Label>
          <Input id="contact_name" name="contact_name" placeholder="Jamie Cruz" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Business email</Label>
          <Input id="email" name="email" type="email" placeholder="hello@happypaws.ph" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+63 917 000 0000" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Quezon City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="123 Main St." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Tell us about your business</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Services offered, number of staff, branches, and anything else we should know."
        />
      </div>

      <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
        We verify your business email before the application reaches the super admin. Approval and
        login details are sent to this address.{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Looking for a pet owner account instead?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Sending code..." : "Send verification code"}
      </Button>
    </form>
  );
}
