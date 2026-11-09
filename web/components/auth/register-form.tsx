"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Role = "customer" | "shop_owner";

export function RegisterForm({ initialRole = "customer" }: { initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
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
    const payload = {
      role,
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      ...(role === "shop_owner"
        ? {
            shop_name: form.get("shop_name"),
            city: form.get("city"),
            address: form.get("address"),
            description: form.get("description"),
          }
        : {}),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      toast.error(data.message ?? "Unable to create the account.");
      setLoading(false);
      return;
    }

    toast.success("Account created.");
    router.push(role === "shop_owner" ? "/shop" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "customer" as const, label: "I'm a pet owner", icon: PawPrint },
          { value: "shop_owner" as const, label: "I run a shop", icon: Building2 },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRole(option.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition",
              role === option.value
                ? "border-brand-600 bg-brand-50"
                : "border-border bg-white hover:border-brand-300"
            )}
          >
            <option.icon
              className={cn("h-5 w-5", role === option.value ? "text-brand-700" : "text-muted-foreground")}
            />
            <span className="text-sm font-bold">{option.label}</span>
          </button>
        ))}
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

      {role === "shop_owner" ? (
        <div className="space-y-4 rounded-2xl border bg-secondary/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Shop details
          </p>
          <div className="space-y-2">
            <Label htmlFor="shop_name">Shop name</Label>
            <Input id="shop_name" name="shop_name" placeholder="Happy Paws Grooming" required={role === "shop_owner"} />
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
            <Label htmlFor="description">Short description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Tell pet owners what makes your shop special."
            />
          </div>
        </div>
      ) : null}

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
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
