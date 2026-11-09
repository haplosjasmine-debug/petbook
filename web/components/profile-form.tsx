"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        phone: form.get("phone"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to update your profile.");
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-first">First name</Label>
          <Input id="profile-first" name="first_name" defaultValue={firstName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-last">Last name</Label>
          <Input id="profile-last" name="last_name" defaultValue={lastName} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email address</Label>
        <Input id="profile-email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          Contact support to change the email on your account.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-phone">Mobile number</Label>
        <Input
          id="profile-phone"
          name="phone"
          defaultValue={phone}
          placeholder="+63 917 000 0000"
        />
        <p className="text-xs text-muted-foreground">
          Used for SMS appointment reminders.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
