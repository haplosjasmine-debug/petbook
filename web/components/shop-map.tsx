"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Coordinates } from "@/lib/geo";

export type MapShop = {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function coordinatesFor(shop: MapShop): Coordinates | null {
  if (shop.latitude === null || shop.longitude === null) return null;
  const latitude = Number(shop.latitude);
  const longitude = Number(shop.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function ShopMap({
  shops,
  userLocation,
  center,
  zoom = 12,
  height = 340,
  className = "",
}: {
  shops: MapShop[];
  userLocation?: Coordinates | null;
  center?: Coordinates | null;
  zoom?: number;
  height?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const L = await import("leaflet");
      if (cancelled || !container.current) return;

      const points = shops
        .map((shop) => ({ shop, coords: coordinatesFor(shop) }))
        .filter((item): item is { shop: MapShop; coords: Coordinates } => Boolean(item.coords));

      const fallbackCenter = center ?? userLocation ?? points[0]?.coords ?? {
        latitude: 14.5995,
        longitude: 120.9842,
      };

      const map = L.map(container.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([fallbackCenter.latitude, fallbackCenter.longitude], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pin = L.divIcon({
        className: "",
        html:
          '<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:#0f766e;border:3px solid #fff;box-shadow:0 8px 20px rgba(15,118,110,.35)">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>' +
          "</svg></span>",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      });

      const bounds: Array<[number, number]> = [];

      points.forEach(({ shop, coords }) => {
        bounds.push([coords.latitude, coords.longitude]);
        L.marker([coords.latitude, coords.longitude], { icon: pin })
          .addTo(map)
          .bindPopup(
            '<div style="min-width:170px;font-family:Segoe UI,system-ui,sans-serif">' +
              `<p style="margin:0;font-size:13px;font-weight:700;color:#0f2e2b">${escapeHtml(
                shop.name
              )}</p>` +
              `<p style="margin:4px 0 8px;font-size:11px;color:#6b7f7c">${escapeHtml(
                [shop.address, shop.city].filter(Boolean).join(", ") || "PetBook partner"
              )}</p>` +
              `<a href="/shops/${encodeURIComponent(shop.slug)}" style="font-size:12px;font-weight:700;color:#0f766e">View shop</a>` +
            "</div>"
          );
      });

      if (userLocation) {
        bounds.push([userLocation.latitude, userLocation.longitude]);
        L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 8,
          color: "#fff",
          weight: 3,
          fillColor: "#f97316",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("Your current location");
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 50);
      mapRef.current = map;
    }

    render().catch(() => null);

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [shops, userLocation, center, zoom]);

  return (
    <div
      ref={container}
      className={`relative z-0 overflow-hidden rounded-2xl border bg-secondary ${className}`}
      style={{ height }}
      aria-label="Map of PetBook partner shops"
    />
  );
}
