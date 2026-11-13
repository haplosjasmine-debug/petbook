"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      home?: string;
    };

    if (!response.ok) {
      toast.error(data.message ?? "Unable to create the account.");
      setLoading(false);
      return;
    }

    toast.success("Account created.");
    router.push(data.home ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          <Input id="phone" name="phone" placeholder="+63 917 000 0000" />
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
        {loading ? "Creating account…" : "Create pet owner account"}
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
