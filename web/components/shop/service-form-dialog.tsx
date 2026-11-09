"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ImagePlus, Loader2, Plus, X } from "lucide-react";
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
import {
  defaultServiceDays,
  defaultServiceFrom,
  defaultServiceTo,
  normalizeServiceDays,
  normalizeServiceImages,
  serviceDayOptions,
  serviceWindow,
  type ServiceDay,
} from "@/lib/service-availability";
import type { Service } from "@/lib/types";

function serviceFormValues(service?: Service) {
  const availability = serviceWindow(
    service ?? { available_from: null, available_to: null }
  );
  const days = normalizeServiceDays(service?.available_days);
  return {
    name: service?.name ?? "",
    category: service?.category ?? "grooming",
    description: service?.description ?? "",
    images: normalizeServiceImages(service?.images),
    available_days: (days.length ? days : defaultServiceDays) as ServiceDay[],
    available_from: availability.from || defaultServiceFrom,
    available_to: availability.to || defaultServiceTo,
    duration_min: String(service?.duration_min ?? 60),
    price: String(service?.price ?? ""),
    active: service?.active ?? true,
  };
}

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
  const [form, setForm] = useState(() => serviceFormValues(service));
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm(serviceFormValues(service));
    }
  }, [open, service]);

  function toggleDay(day: ServiceDay) {
    setForm((current) => ({
      ...current,
      available_days: current.available_days.includes(day)
        ? current.available_days.filter((item) => item !== day)
        : [...current.available_days, day],
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.available_days.length) {
      toast.error("Choose at least one available day.");
      return;
    }
    if (form.available_from >= form.available_to) {
      toast.error("The availability end time must be after the start time.");
      return;
    }
    setLoading(true);

    const response = await fetch(service ? `/api/shop/services/${service.id}` : "/api/shop/services", {
      method: service ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        description: form.description,
        images: form.images.map((image) => image.trim()).filter(Boolean),
        available_days: form.available_days,
        available_from: form.available_from,
        available_to: form.available_to,
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Images</Label>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {form.images.length}/8
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste image URLs. The first image is the cover shown in search results.
            </p>
            {form.images.length ? (
              <div className="space-y-2">
                {form.images.map((image, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border bg-secondary/60 text-muted-foreground">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                    </span>
                    <Input
                      value={image}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          images: current.images.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          ),
                        }))
                      }
                      placeholder="https://example.com/service-photo.jpg"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          images: current.images.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={form.images.length >= 8}
              onClick={() =>
                setForm((current) => ({ ...current, images: [...current.images, ""] }))
              }
            >
              <ImagePlus className="h-4 w-4" /> Add image
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border bg-secondary/40 p-3.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              <Label>Service availability</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {serviceDayOptions.map((day) => {
                const selected = form.available_days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    aria-pressed={selected}
                    className={
                      selected
                        ? "rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white"
                        : "rounded-full border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-brand-300 hover:text-brand-700"
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="service-from" className="text-xs">
                  Available from
                </Label>
                <Input
                  id="service-from"
                  type="time"
                  value={form.available_from}
                  onChange={(event) => setForm({ ...form, available_from: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service-to" className="text-xs">
                  Available until
                </Label>
                <Input
                  id="service-to"
                  type="time"
                  value={form.available_to}
                  onChange={(event) => setForm({ ...form, available_to: event.target.value })}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Customers can only book this service inside this time window.
            </p>
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
