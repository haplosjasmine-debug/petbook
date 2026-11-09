"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Shop } from "@/lib/types";

export function ShopSettingsForm({ shop }: { shop: Shop }) {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [latitude, setLatitude] = useState(
    shop.latitude === null || shop.latitude === undefined ? "" : String(shop.latitude)
  );
  const [longitude, setLongitude] = useState(
    shop.longitude === null || shop.longitude === undefined ? "" : String(shop.longitude)
  );
  const router = useRouter();

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("This browser does not support GPS location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setLocating(false);
        toast.success("Location captured. Save to update your map pin.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to read your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/shop/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        city: form.get("city"),
        address: form.get("address"),
        description: form.get("description"),
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      toast.error(data.message ?? "Unable to update the shop.");
      return;
    }

    toast.success("Shop updated.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shop-name">Shop name</Label>
          <Input id="shop-name" name="name" defaultValue={shop.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-phone">Phone</Label>
          <Input id="shop-phone" name="phone" defaultValue={shop.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-email">Email</Label>
          <Input id="shop-email" name="email" type="email" defaultValue={shop.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-city">City</Label>
          <Input id="shop-city" name="city" defaultValue={shop.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-address">Address</Label>
          <Input id="shop-address" name="address" defaultValue={shop.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-latitude">Latitude</Label>
          <Input
            id="shop-latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="14.5547"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-longitude">Longitude</Label>
          <Input
            id="shop-longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="121.0244"
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-2 rounded-2xl border border-dashed bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">GPS pin for map discovery</p>
            <p className="text-xs text-muted-foreground">
              Capture the shop location while you are on site so nearby pet owners can find you.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            {locating ? "Locating…" : "Use my location"}
          </Button>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shop-description">Description</Label>
          <Textarea
            id="shop-description"
            name="description"
            rows={4}
            defaultValue={shop.description ?? ""}
            placeholder="Tell pet owners what makes your shop special."
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
