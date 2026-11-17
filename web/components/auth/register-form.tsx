"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MailCheck,
  PawPrint,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "details" | "verify";

type StartResponse = {
  message?: string;
  email?: string;
  expiresAt?: number;
  home?: string;
};

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | undefined>();
  const router = useRouter();

  async function startRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (String(form.get("password")) !== String(form.get("confirm_password"))) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "pet_owner",
        first_name: String(form.get("first_name") ?? ""),
        last_name: String(form.get("last_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as StartResponse;
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to send the verification code.");
      return;
    }

    setEmail(data.email ?? String(form.get("email") ?? ""));
    setExpiresAt(data.expiresAt);
    setCode("");
    setStep("verify");
    toast.success("Verification code sent. Check your inbox.");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = (await response.json().catch(() => ({}))) as StartResponse;
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to verify your email.");
      setCode("");
      return;
    }

    toast.success(data.message ?? "Email verified.");
    router.push(data.home ?? "/login?verified=1");
    router.refresh();
  }

  async function resendCode() {
    setResending(true);
    const response = await fetch("/api/auth/register/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => ({}))) as StartResponse;
    setResending(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to resend the verification code.");
      return;
    }

    setExpiresAt(data.expiresAt);
    setCode("");
    toast.success("A new verification code was sent.");
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
            <p className="text-sm font-black">Enter your verification code</p>
            <p className="mt-1 text-xs text-brand-800/70">
              We sent a 6-digit code to <span className="font-semibold">{email}</span>. Enter it to
              finish creating your account.
            </p>
            <p className="mt-2 text-xs text-brand-800/60">
              The code expires in about {minutes} minute{minutes === 1 ? "" : "s"}. Check your spam
              folder if it does not arrive.
            </p>
          </div>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification_code">Verification code</Label>
            <Input
              id="verification_code"
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {loading ? "Verifying..." : "Verify and create account"}
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
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
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
            Edit details
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={startRegistration} className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 text-brand-900">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700">
          <PawPrint className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black">Pet owner account</p>
          <p className="text-xs text-brand-800/70">
            Book care, track records, and collect loyalty points.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" placeholder="Jamie" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" placeholder="Cruz" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+63 917 123 4567"
            required
          />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Philippine mobile only (+639XXXXXXXXX or 09XXXXXXXXX). Used for sign-in alert SMS.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" name="confirm_password" type="password" minLength={8} required />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-input" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
            terms of service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            privacy policy
          </Link>
          .
        </span>
      </label>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Sending verification code..." : "Send verification code"}
      </Button>

      <p className="rounded-xl bg-secondary p-3 text-center text-xs text-muted-foreground">
        Run a pet business?{" "}
        <Link href="/business/apply" className="font-semibold text-brand-700 hover:underline">
          Apply for a business owner account
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
