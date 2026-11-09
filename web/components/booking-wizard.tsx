"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  PawPrint,
  Scissors,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { serviceAvailabilityLabel } from "@/lib/service-availability";
import type { Appointment, Pet, Service, Shop, Staff } from "@/lib/types";
import { formatMoney, titleCase } from "@/lib/utils";

type Slot = { value: string; label: string; available: boolean };

type Option = { value: string; label: string };

export function BookingWizard({
  shops,
  pets,
  initialShopId,
  initialServiceId,
}: {
  shops: Shop[];
  pets: Pet[];
  initialShopId?: number;
  initialServiceId?: number;
}) {
  const router = useRouter();
  const [shopId, setShopId] = useState(initialShopId ? String(initialShopId) : "");
  const [serviceId, setServiceId] = useState(initialServiceId ? String(initialServiceId) : "");
  const [staffId, setStaffId] = useState("");
  const [petId, setPetId] = useState(pets[0] ? String(pets[0].id) : "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "paymongo">("cash");

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    appointment: Appointment;
    qr?: string | null;
  } | null>(null);

  const shop = shops.find((item) => String(item.id) === shopId) ?? null;
  const service = services.find((item) => String(item.id) === serviceId) ?? null;
  const pet = pets.find((item) => String(item.id) === petId) ?? null;
  const member = staff.find((item) => String(item.id) === staffId) ?? null;

  const today = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!shopId) {
      setServices([]);
      setStaff([]);
      setServiceId("");
      setStaffId("");
      return;
    }

    let cancelled = false;
    setLoadingOptions(true);
    setServiceId("");
    setStaffId("");
    setSlots([]);
    setSlot("");

    fetch(`/api/public/shops/${shopId}/services`)
      .then((response) => response.json())
      .then((data: { services?: Service[]; staff?: Staff[] }) => {
        if (cancelled) return;
        setServices(data.services ?? []);
        setStaff(data.staff ?? []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load shop services.");
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (!serviceId && initialServiceId && services.length) {
      const match = services.find((item) => item.id === initialServiceId);
      if (match) setServiceId(String(match.id));
    }
  }, [services, serviceId, initialServiceId]);

  useEffect(() => {
    setSlot("");
    if (!shopId || !serviceId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    const params = new URLSearchParams({ shopId, serviceId, date });
    if (staffId) params.set("staffId", staffId);

    fetch(`/api/public/slots?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { slots?: Slot[] }) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, serviceId, date, staffId]);

  async function submit() {
    if (!shop || !service || !pet || !slot) {
      toast.error("Choose a shop, service, pet, and time slot.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: shop.id,
        service_id: service.id,
        pet_id: pet.id,
        staff_id: member?.id ?? null,
        start_at: slot,
        notes,
        payment_method: paymentMethod,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      appointment?: Appointment;
      checkout_url?: string | null;
    };

    if (!response.ok || !data.appointment) {
      toast.error(data.message ?? "Unable to book the appointment.");
      setSubmitting(false);
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    toast.success("Booking created.");
    setSubmitting(false);
    setSuccess({ appointment: data.appointment });
    fetch(`/api/qr/${encodeURIComponent(data.appointment.qr_code)}`)
      .then((result) => result.json())
      .then((qr: { image?: string }) => {
        if (qr.image) setSuccess({ appointment: data.appointment!, qr: qr.image });
      })
      .catch(() => null);
  }

  async function payOnline() {
    if (!success) return;
    setSubmitting(true);
    const response = await fetch(`/api/bookings/${success.appointment.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "paymongo" }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      checkout_url?: string;
    };
    setSubmitting(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to start payment.");
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    router.push(`/dashboard/appointments/${success.appointment.id}`);
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-2xl font-black">You're booked!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {service?.name} for {pet?.name} at {shop?.name}
          </p>

          {success.qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={success.qr}
              alt="Booking QR code"
              className="mx-auto mt-5 h-44 w-44 rounded-xl border bg-white p-2"
            />
          ) : null}

          <p className="mt-3 break-all rounded-xl bg-secondary px-3 py-2 font-mono text-xs font-bold">
            {success.appointment.qr_code}
          </p>

          <div className="mt-5 grid gap-2 rounded-2xl bg-secondary/60 p-4 text-left text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">When</p>
              <p className="font-semibold">
                {new Date(success.appointment.start_at).toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatMoney(success.appointment.price)}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/dashboard/appointments/${success.appointment.id}`}>
                View appointment
              </Link>
            </Button>
            {paymentMethod === "paymongo" ? (
              <Button variant="outline" onClick={payOnline} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Complete online payment
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/dashboard/appointments">My appointments</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-brand-600" /> 1. Choose a shop and service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shop</Label>
              <Select value={shopId} onChange={(event) => setShopId(event.target.value)}>
                <option value="">Select a shop</option>
                {shops.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.city ? `· ${item.city}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            {shopId ? (
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Loading services…" : "Select a service"}
                  </option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {formatMoney(item.price)} · {item.duration_min} min
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {service ? (
              <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                <p className="font-bold">{service.name}</p>
                <p className="mt-0.5 text-xs text-brand-900/70">
                  {service.description || "Professional care from a trusted team."}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800">
                  <CalendarDays className="h-3.5 w-3.5" />{" "}
                  {serviceAvailabilityLabel(service)}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PawPrint className="h-4 w-4 text-brand-600" /> 2. Pet and staff
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pet</Label>
              {pets.length ? (
                <Select value={petId} onChange={(event) => setPetId(event.target.value)}>
                  {pets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {titleCase(item.species)}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                  No pets yet.{" "}
                  <Link href="/dashboard/pets" className="font-semibold text-brand-700 hover:underline">
                    Add a pet
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preferred staff</Label>
              <Select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
                <option value="">Any available staff</option>
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {titleCase(item.role)}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-brand-600" /> 3. Date and time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={!serviceId}
              />
            </div>

            {date && serviceId ? (
              <div>
                <Label>Available times</Label>
                {loadingSlots ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
                  </div>
                ) : slots.length ? (
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        disabled={!item.available}
                        onClick={() => setSlot(item.value)}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                          slot === item.value
                            ? "border-brand-600 bg-brand-600 text-white"
                            : item.available
                              ? "bg-white hover:border-brand-400 hover:bg-brand-50"
                              : "cursor-not-allowed bg-secondary text-muted-foreground line-through"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No slots left for this date. Try another day.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a service and date to see available times.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-brand-600" /> 4. Payment and notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "cash" as const, label: "Pay at shop", text: "Settle after the visit" },
                { value: "paymongo" as const, label: "Pay online", text: "GCash, Maya, card" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    paymentMethod === option.value
                      ? "border-brand-600 bg-brand-50"
                      : "bg-white hover:border-brand-300"
                  }`}
                >
                  <p className="text-sm font-black">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.text}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes for the shop</Label>
              <Textarea
                id="booking-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Anything the team should know about your pet?"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Shop</span>
              <span className="text-right font-semibold">{shop?.name ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Service</span>
              <span className="text-right font-semibold">{service?.name ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Pet</span>
              <span className="text-right font-semibold">{pet?.name ?? "—"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Staff</span>
              <span className="text-right font-semibold">{member?.name ?? "Any available"}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Time</span>
              <span className="text-right font-semibold">
                {slot
                  ? new Date(slot).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" /> Total
              </span>
              <span className="text-xl font-black">{formatMoney(service?.price ?? 0)}</span>
            </div>
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={submit}
              disabled={submitting || !slot || !petId || pets.length === 0}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Booking…" : "Confirm booking"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Free to book. Cancel any time from your dashboard.
            </p>
          </CardContent>
        </Card>

        {staff.length ? (
          <Card className="mt-4">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <UserRound className="h-4 w-4 text-brand-600" /> Need a specific specialist?
              </p>
              <p className="mt-1 text-xs">
                Choose a team member in step 2 to see only their availability.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
