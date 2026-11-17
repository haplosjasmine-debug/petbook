"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "reset";

type RequestResponse = {
  message?: string;
  email?: string;
  expiresAt?: number;
};

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | undefined>();
  const router = useRouter();

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("email") ?? "").trim().toLowerCase();
    setLoading(true);

    const response = await fetch("/api/auth/password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value }),
    });
    const data = (await response.json().catch(() => ({}))) as RequestResponse;
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to send the password reset code.");
      return;
    }

    setEmail(data.email ?? value);
    setMessage(
      data.message ??
        "If an account exists for this email, we sent a 6-digit password reset code. Check your inbox and spam folder."
    );
    setExpiresAt(data.expiresAt);
    setCode("");
    setStep("reset");
    toast.success("Password reset code sent. Check your inbox.");
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password !== String(form.get("confirm_password") ?? "")) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, password }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to reset your password.");
      return;
    }

    toast.success(data.message ?? "Password updated. Sign in with your new password.");
    router.push("/login?reset=1");
    router.refresh();
  }

  async function resendCode() {
    setResending(true);
    const response = await fetch("/api/auth/password/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => ({}))) as RequestResponse;
    setResending(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to resend the password reset code.");
      return;
    }

    setExpiresAt(data.expiresAt);
    setCode("");
    toast.success("A new password reset code was sent.");
  }

  if (step === "reset") {
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
            <p className="text-sm font-black">Enter your reset code</p>
            <p className="mt-1 text-xs text-brand-800/70">{message}</p>
            <p className="mt-2 text-xs font-semibold text-brand-800">{email}</p>
            <p className="mt-2 text-xs text-brand-800/60">
              The code expires in about {minutes} minute{minutes === 1 ? "" : "s"}. Check your spam
              folder if it does not arrive.
            </p>
          </div>
        </div>

        <form onSubmit={resetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset_code">Verification code</Label>
            <Input
              id="reset_code"
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

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                className="pl-10"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Repeat your password"
                className="pl-10"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || code.length !== 6}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {loading ? "Updating password..." : "Verify code and update password"}
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
              setStep("email");
              setCode("");
              setExpiresAt(undefined);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Use a different email
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="pl-10"
            autoComplete="email"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We will email a 6-digit code. You need that code before you can set a new password.
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Sending code..." : "Send reset code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
