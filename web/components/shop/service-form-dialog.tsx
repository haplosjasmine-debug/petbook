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
import type { Service } from "@/lib/types";

export function ServiceFormDialog({
  service,
  label,
  variant = "default",
}: {
  service?: Service;
  label?: string;
  variant?: "default" | "outline" | "soft" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: service?.name ?? "",
    category: service?.category ?? "grooming",
    description: service?.description ?? "",
    duration_min: String(service?.duration_min ?? 60),
    price: String(service?.price ?? ""),
    active: service?.active ?? true,
  });
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm({
        name: service?.name ?? "",
        category: service?.category ?? "grooming",
        description: service?.description ?? "",
        duration_min: String(service?.duration_min ?? 60),
        price: String(service?.price ?? ""),
        active: service?.active ?? true,
      });
    }
  }, [open, service]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch(service ? `/api/shop/services/${service.id}` : "/api/shop/services", {
      method: service ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        description: form.description,
        duration_min: Number(form.duration_min),
        price: Number(form.price),
        active: form.active,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to save the service.");
      return;
    }

    toast.success(service ? "Service updated." : "Service added.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={service ? "sm" : "default"}>
          {!service ? <Plus className="h-4 w-4" /> : null}
          {label ?? (service ? "Edit" : "Add service")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add a service"}</DialogTitle>
          <DialogDescription>
            Services appear on your public shop page and in the booking flow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Full grooming session"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-category">Category</Label>
              <Select
                id="service-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                <option value="grooming">Grooming</option>
                <option value="veterinary">Veterinary</option>
                <option value="package">Package</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duration (minutes)</Label>
              <Input
                id="service-duration"
                type="number"
                min={5}
                max={600}
                value={form.duration_min}
                onChange={(event) => setForm({ ...form, duration_min: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Price (PHP)</Label>
              <Input
                id="service-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                Active and bookable
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Textarea
              id="service-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="What is included in this service?"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Saving…" : service ? "Save changes" : "Add service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteServiceButton({ serviceId }: { serviceId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Remove this service? This cannot be undone.")) return;
    setLoading(true);
    const response = await fetch(`/api/shop/services/${serviceId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to remove the service.");
      return;
    }

    toast.success("Service removed.");
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
