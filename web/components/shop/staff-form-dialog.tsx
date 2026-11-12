"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Staff } from "@/lib/types";

export function StaffFormDialog({
  member,
  label,
  variant = "default",
}: {
  member?: Staff;
  label?: string;
  variant?: "default" | "outline" | "soft" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: member?.name ?? "",
    role: member?.role ?? "groomer",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    bio: member?.bio ?? "",
    active: member?.active ?? true,
    password: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm({
        name: member?.name ?? "",
        role: member?.role ?? "groomer",
        email: member?.email ?? "",
        phone: member?.phone ?? "",
        bio: member?.bio ?? "",
        active: member?.active ?? true,
        password: "",
      });
    }
  }, [open, member]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch(member ? `/api/shop/staff/${member.id}` : "/api/shop/staff", {
      method: member ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to save the staff member.");
      return;
    }

    toast.success(member ? "Staff member updated." : "Staff member added.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={member ? "sm" : "default"}>
          {!member ? <Plus className="h-4 w-4" /> : null}
          {label ?? (member ? "Edit" : "Add staff")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit staff member" : "Add a staff member"}</DialogTitle>
          <DialogDescription>
            Staff members can be assigned to appointments and shown on your public page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name</Label>
              <Input
                id="staff-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <Select
                id="staff-role"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="groomer">Groomer</option>
                <option value="vet">Veterinarian</option>
                <option value="assistant">Assistant</option>
                <option value="manager">Manager</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">
              {member?.user ? "Reset login password" : "Staff login password"}
            </Label>
            <Input
              id="staff-password"
              type="password"
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={member?.user ? "Leave blank to keep current" : "Optional, at least 8 characters"}
            />
            <p className="text-xs text-muted-foreground">
              Add an email and password to create a Staff workspace login for this person.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-bio">Bio</Label>
            <Textarea
              id="staff-bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              rows={3}
              placeholder="Experience, specialties, and what pet owners should know."
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            Active and assignable
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : member ? "Save changes" : "Add staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteStaffButton({ staffId }: { staffId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Remove this staff member? This cannot be undone.")) return;
    setLoading(true);
    const response = await fetch(`/api/shop/staff/${staffId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to remove the staff member.");
      return;
    }

    toast.success("Staff member removed.");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-red-50"
      onClick={remove}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Remove
    </Button>
  );
}
