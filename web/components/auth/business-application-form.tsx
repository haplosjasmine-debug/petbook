"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BusinessApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/business-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: form.get("business_name"),
        contact_name: form.get("contact_name"),
        email: form.get("email"),
        phone: form.get("phone"),
        city: form.get("city"),
        address: form.get("address"),
        message: form.get("message"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to submit your application.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="grid place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-black">Application received</h2>
        <p className="mt-2 max-w-md text-sm text-emerald-900/70">
          The PetBook super admin will review your business details. Once approved, you can sign in
          with an account created for your business email.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to PetBook</Link>
        </Button>
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
        Business accounts are reviewed by the platform super admin. You will receive instructions at
        this email after approval.{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Looking for a pet owner account instead?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Submitting application…" : "Submit application"}
      </Button>
    </form>
  );
}
